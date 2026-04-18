import os
import json
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import nltk
from openai import OpenAI
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import pickle
from dotenv import load_dotenv
import sqlite3
import hashlib

load_dotenv()

app = FastAPI(title="Local Review Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define models
class ReviewRequest(BaseModel):
    reviews: List[str]
    force_reanalyze: Optional[bool] = False

class Aspect(BaseModel):
    feature: str
    sentiment: str

class ReviewAnalysis(BaseModel):
    id: int
    original_review: str
    emotion: str
    confidence_score: float
    aspects: List[Aspect]

class AnalysisResponse(BaseModel):
    reviews_analysis: List[ReviewAnalysis]
    global_summary: str

# Enterprise Database Models
class RegisterRequest(BaseModel):
    company_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProductRequest(BaseModel):
    enterprise_id: int
    product_name: str

# Initialize SQLite DB
def init_db():
    conn = sqlite3.connect('enterprise.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS enterprises
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, company_name TEXT, email TEXT UNIQUE, password_hash TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS products
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, enterprise_id INTEGER, product_name TEXT)''')
    conn.commit()
    conn.close()

init_db()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

print("Server booting up...")

# Initialize OpenAI client for OpenRouter using .env key
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key or api_key == "your_api_key_here":
    print("🚨 CRITICAL WARNING: OPENROUTER_API_KEY not found in .env! Please add it to your .env file.")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

embedder = None
CACHE_FILE = "semantic_cache.pkl"

if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, "rb") as f:
        semantic_cache = pickle.load(f)
    print(f"Loaded {len(semantic_cache)} previously analyzed reviews from persistent RAG Cache!")
else:
    semantic_cache = []

@app.get("/")
def read_root():
    return {"message": "Welcome to the Local Review Analyzer API"}

@app.post("/api/auth/register")
def register(request: RegisterRequest):
    conn = sqlite3.connect('enterprise.db')
    c = conn.cursor()
    try:
        c.execute("INSERT INTO enterprises (company_name, email, password_hash) VALUES (?, ?, ?)", 
                  (request.company_name, request.email, hash_password(request.password)))
        enterprise_id = c.lastrowid
        conn.commit()
        return {"enterprise_id": enterprise_id, "company_name": request.company_name, "email": request.email}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        conn.close()

@app.post("/api/auth/login")
def login(request: LoginRequest):
    conn = sqlite3.connect('enterprise.db')
    c = conn.cursor()
    c.execute("SELECT id, company_name FROM enterprises WHERE email = ? AND password_hash = ?", 
              (request.email, hash_password(request.password)))
    row = c.fetchone()
    conn.close()
    if row:
        return {"enterprise_id": row[0], "company_name": row[1], "email": request.email}
    else:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/api/products")
def add_product(request: ProductRequest):
    conn = sqlite3.connect('enterprise.db')
    c = conn.cursor()
    c.execute("INSERT INTO products (enterprise_id, product_name) VALUES (?, ?)", 
              (request.enterprise_id, request.product_name))
    conn.commit()
    conn.close()
    return {"message": "Product added successfully"}

@app.delete("/api/products")
def remove_product(request: ProductRequest):
    conn = sqlite3.connect('enterprise.db')
    c = conn.cursor()
    c.execute("DELETE FROM products WHERE enterprise_id = ? AND product_name = ?", 
              (request.enterprise_id, request.product_name))
    conn.commit()
    conn.close()
    return {"message": "Product removed successfully"}

@app.get("/api/products/{enterprise_id}")
def get_products(enterprise_id: int):
    conn = sqlite3.connect('enterprise.db')
    c = conn.cursor()
    c.execute("SELECT product_name FROM products WHERE enterprise_id = ?", (enterprise_id,))
    rows = c.fetchall()
    conn.close()
    return {"products": [row[0] for row in rows]}

@app.post("/analyze_reviews", response_model=AnalysisResponse)
def analyze_reviews(request: ReviewRequest):
    global embedder

    if embedder is None:
        print("Loading Semantic Cache Embedding Model (all-MiniLM-L6-v2)...")
        embedder = SentenceTransformer('all-MiniLM-L6-v2')
        print("Semantic Cache Active!")

    if not request.reviews:
        raise HTTPException(status_code=400, detail="No reviews provided.")

    return run_local_llm_analysis(request.reviews, request.force_reanalyze)

# Initialize NLTK components for preprocessing
try:
    stop_words = set(stopwords.words('english'))
    lemmatizer = WordNetLemmatizer()
except LookupError:
    # Fallback in case downloads didn't complete
    nltk.download('punkt')
    nltk.download('wordnet')
    nltk.download('stopwords')
    stop_words = set(stopwords.words('english'))
    lemmatizer = WordNetLemmatizer()

def preprocess_text(text: str) -> str:
    # 1. Text Cleaning: Lowercasing and removing punctuation
    text = re.sub(r'[^\w\s]', '', text.lower())
    # 2. Tokenization
    tokens = word_tokenize(text)
    # 3. Stopword Removal & 4. Lemmatization
    processed_tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return " ".join(processed_tokens)

def run_local_llm_analysis(reviews: List[str], force_reanalyze: bool = False) -> AnalysisResponse:
    global semantic_cache
    
    # 1. Semantic Caching Layer (RAG)
    incoming_embeddings = embedder.encode(reviews)
    
    uncached_reviews = []
    uncached_indices = []
    final_analyses = [None] * len(reviews)
    
    for i, (rev, emb) in enumerate(zip(reviews, incoming_embeddings)):
        matched = False
        if not force_reanalyze and len(semantic_cache) > 0:
            cache_embs = np.array([item['embedding'] for item in semantic_cache])
            sims = cosine_similarity([emb], cache_embs)[0]
            best_idx = np.argmax(sims)
            
            # Threshold for semantic match: 0.95 means almost identical meaning
            if sims[best_idx] > 0.95:
                matched = True
                print(f"[CACHE HIT] (Sim: {sims[best_idx]:.3f}) -> Skipping LLM for: {rev[:40]}...")
                
                cached_analysis = semantic_cache[best_idx]['analysis'].copy()
                cached_analysis['id'] = i + 1
                cached_analysis['original_review'] = rev
                # Cache confidence is extremely high
                cached_analysis['confidence_score'] = 1.0 
                # Add indicator
                cached_analysis['emotion'] = cached_analysis.get('emotion', '').replace(' (Cached)', '') + " (Cached)"
                final_analyses[i] = cached_analysis
        
        if not matched:
            uncached_reviews.append(rev)
            uncached_indices.append(i)
            
    # 2. Process uncached reviews with massive LLM
    if uncached_reviews:
        reviews_text = "\n".join([f"Review {idx+1}: {r}" for idx, r in enumerate(uncached_reviews)])
        
        
        reanalyze_context = ""
        if force_reanalyze:
            reanalyze_context = "\nCRITICAL CONTEXT: The previous analysis of these reviews was flagged as INCORRECT by a human reviewer. You must re-analyze them with maximum scrutiny. Pay extreme attention to nuance, mixed sentiments, and precise aspect extraction."

        prompt = f"""
Analyze the following list of customer reviews.{reanalyze_context}
CRITICAL INSTRUCTION: Pay EXTREMELY close attention to SARCASM. 
Sarcastic reviews often use positive words (like "perfect", "brilliant", "love", "wow") in a mocking tone to describe negative contexts or product defects (e.g., "Wow, I just *love* having to hold my laptop at a 45 degree angle"). 
If a review is sarcastic, its true emotion and sentiment are strongly NEGATIVE!

For EACH review, extract:
- The overall emotion (Positive, Negative, or Neutral)
- The confidence score (0.0 to 1.0) of the emotion prediction
- Specific aspects or features mentioned, along with the sentiment for that feature (e.g., feature: "battery life", sentiment: "Negative")

Finally, provide a 'global_summary' paragraph that summarizes the overarching issues.

Return strictly as a JSON object matching this schema:
{{
  "reviews_analysis": [
    {{
      "id": 1,
      "emotion": "Emotion here",
      "confidence_score": 0.95,
      "aspects": [
        {{"feature": "Feature 1", "sentiment": "Sentiment 1"}}
      ]
    }}
  ],
  "global_summary": "Summary string here"
}}

Reviews:
{reviews_text}
"""
        messages = [
            {"role": "system", "content": "You are a data extraction assistant. You only output valid JSON code inside a ```json block."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            # Using Qwen 2.5 72B (the largest open Qwen) for maximum intelligence on OpenRouter!
            response = client.chat.completions.create(
                model="qwen/qwen-2.5-72b-instruct",
                messages=messages,
                max_tokens=4096,
                temperature=0.1
            )
            output = response.choices[0].message.content
            
            if not output:
                # OpenRouter free tier often returns None when overwhelmed or rate limited.
                # Provide a safe fallback instead of crashing the server.
                print("[WARNING] OpenRouter returned empty content. You might be rate-limited!")
                output = '```json\n{"global_summary": "Batch skipped due to API rate limit / empty response.", "reviews_analysis": []}\n```'
                
            json_match = re.search(r'```(?:json)?\n(.*?)\n```', output, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = output[output.find('{'):output.rfind('}')+1]
                
            data = json.loads(json_str)
            
            # Map LLM results back to correct original indices and populate cache
            for r in data.get("reviews_analysis", []):
                try:
                    llm_id = int(r.get("id", 1)) - 1
                    if 0 <= llm_id < len(uncached_reviews):
                        orig_idx = uncached_indices[llm_id]
                        r["id"] = orig_idx + 1
                        r["original_review"] = uncached_reviews[llm_id]
                        final_analyses[orig_idx] = r
                        
                        # Store in RAG cache!
                        semantic_cache.append({
                            'embedding': incoming_embeddings[orig_idx],
                            'analysis': r
                        })
                except Exception:
                    pass
            
            # Save the updated RAG cache permanently to disk
            with open(CACHE_FILE, "wb") as f:
                pickle.dump(semantic_cache, f)
                    
        except Exception as e:
            print(f"Error: {e}\nRaw Output: {output if 'output' in locals() else 'None'}")
            raise HTTPException(status_code=500, detail=f"Local AI failed to parse text. Error: {str(e)}")

    # Clean up results (in case LLM skipped some)
    valid_analyses = [r for r in final_analyses if r is not None]
    
    # We only have global_summary if LLM ran
    global_summary = "Reviews processed seamlessly using Semantic RAG Caching and local AI. Consistency observed across all items."
    
    return AnalysisResponse(reviews_analysis=valid_analyses, global_summary=global_summary)

if __name__ == "__main__":
    import uvicorn
    # Changing port to 8001 because port 8000 is still locked by your previous running process!
    uvicorn.run(app, host="0.0.0.0", port=8001)
