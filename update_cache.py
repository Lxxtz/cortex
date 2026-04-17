import pickle
import os
import json
from sentence_transformers import SentenceTransformer

def main():
    cache_file = "semantic_cache.pkl"
    json_path = os.path.join("frontend", "src", "data.json")
    
    print("Loading embedder...")
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Load JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    reviews = data.get("reviews", [])
    
    # Load existing cache
    if os.path.exists(cache_file):
        with open(cache_file, "rb") as f:
            semantic_cache = pickle.load(f)
        print(f"Loaded existing cache with {len(semantic_cache)} entries.")
    else:
        semantic_cache = []
        print("Created new cache.")
        
    # Find reviews that are in JSON but not in cache
    # Wait, simple way: clear cache and rebuild? No, building 1000 embeddings takes a few seconds.
    # Let's just build embeddings for the LAST 300 reviews since we know we appended them.
    new_reviews = reviews[-300:]
    
    texts_to_embed = [r["review_text"] for r in new_reviews]
    print(f"Embedding {len(texts_to_embed)} new reviews...")
    embeddings = embedder.encode(texts_to_embed)
    
    for idx, (review_data, emb) in enumerate(zip(new_reviews, embeddings)):
        # Construct the analysis object that the backend expects
        analysis = {
            "id": idx + 1,
            "original_review": review_data["review_text"],
            "emotion": review_data["emotion"],
            "confidence_score": review_data["confidence_score"],
            "aspects": review_data.get("aspects", [])
        }
        
        semantic_cache.append({
            "embedding": emb,
            "analysis": analysis
        })
        
    # Save back
    with open(cache_file, "wb") as f:
        pickle.dump(semantic_cache, f)
        
    print(f"Successfully updated cache. Total entries: {len(semantic_cache)}")

if __name__ == "__main__":
    main()
