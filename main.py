import os
import json
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import torch

app = FastAPI(title="Local Review Analyzer API")

# Define models
class ReviewRequest(BaseModel):
    reviews: List[str]

class Aspect(BaseModel):
    feature: str
    sentiment: str

class ReviewAnalysis(BaseModel):
    id: int
    emotion: str
    aspects: List[Aspect]

class AnalysisResponse(BaseModel):
    reviews_analysis: List[ReviewAnalysis]
    global_summary: str

print("Server booting up...")

# Initialize pipe as None to lazy load it
pipe = None

@app.get("/")
def read_root():
    return {"message": "Welcome to the Local Review Analyzer API"}

@app.post("/analyze_reviews", response_model=AnalysisResponse)
def analyze_reviews(request: ReviewRequest):
    global pipe
    
    # Lazy load the model on the first request so the Uvicorn server can actually start immediately!
    if pipe is None:
        print("First request received! Loading ultra-fast Local AI (Downloading weights if first time)...")
        pipe = pipeline(
            "text-generation", 
            model="Qwen/Qwen2.5-1.5B-Instruct", 
            device=0,  # Uses the primary GPU (RTX 4050)
            model_kwargs={"torch_dtype": torch.float16} # Ensures it easily fits in your 6GB VRAM
        )
        print("Local AI Loaded & Ready!")

    if not request.reviews:
        raise HTTPException(status_code=400, detail="No reviews provided.")

    return run_local_llm_analysis(request.reviews)

def run_local_llm_analysis(reviews: List[str]) -> AnalysisResponse:
    reviews_text = "\n".join([f"Review {i+1}: {r}" for i, r in enumerate(reviews)])
    
    prompt = f"""
Analyze the following list of customer reviews.

For EACH review, extract:
- The overall emotion (Positive, Negative, or Neutral)
- Specific aspects or features mentioned, along with the sentiment for that feature (e.g., feature: "battery life", sentiment: "Negative")

Finally, provide a 'global_summary' paragraph that summarizes the overarching issues.

Return strictly as a JSON object matching this schema:
{{
  "reviews_analysis": [
    {{
      "id": 1,
      "emotion": "Emotion here",
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
        # Generate text
        output = pipe(messages, max_new_tokens=1024, return_full_text=False)[0]['generated_text']
        
        # safely extract the json portion from the output
        json_match = re.search(r'```(?:json)?\n(.*?)\n```', output, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = output[output.find('{'):output.rfind('}')+1]
            
        data = json.loads(json_str)
        return AnalysisResponse(**data)
    except Exception as e:
        print(f"Error: {e}\nRaw Output: {output if 'output' in locals() else 'None'}")
        raise HTTPException(status_code=500, detail=f"Local AI failed to parse text. Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Changing port to 8001 because port 8000 is still locked by your previous running process!
    uvicorn.run(app, host="0.0.0.0", port=8001)
