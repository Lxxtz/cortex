import requests
import json
import matplotlib.pyplot as plt
from collections import Counter
import sys

URL = "http://localhost:8001/analyze_reviews"

import os

# Load the actual tech reviews scraped by scraper.py
def get_tech_reviews():
    file_path = "tech_reviews.json"
    
    if not os.path.exists(file_path):
        print("[-] 'tech_reviews.json' not found! Please run 'python scraper.py' first to scrape the 300 tech products.")
        exit()
        
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    reviews = []
    for item in data:
        # We stringify the rich data so the AI can read it all at once
        prod = item.get("product", "Unknown Product")
        date = item.get("date", "Unknown Date")
        loc = item.get("location", "Unknown Location")
        text = item.get("review", "")
        
        rich_review = f"Product: {prod}\nDate: {date}\nLocation: {loc}\nReview: {text}"
        reviews.append(rich_review)
        
    return reviews

reviews = get_tech_reviews()

print(f"Total reviews queued for AI parsing: {len(reviews)}")

# We increased batch size to 10 because OpenRouter's massive cloud GPUs can easily handle it!
batch_size = 10
negative_aspects = []

import concurrent.futures
from collections import Counter
import matplotlib.pyplot as plt
import requests

print(f"Sending reviews to OpenRouter API in parallel batches of {batch_size} (10 simultaneous threads!)...")

def process_batch(idx, batch):
    try:
        response = requests.post(URL, json={"reviews": batch})
        response.raise_for_status()
        return idx, response.json()
    except Exception as e:
        return idx, None

batches = [reviews[i:i+batch_size] for i in range(0, len(reviews), batch_size)]
results = []

print(f"\n[!] Using ThreadPoolExecutor to blast {len(batches)} requests to the cloud concurrently...")

# We dropped max_workers from 10 to 3 to prevent overwhelming OpenRouter's rate limit for free keys!
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    futures = {executor.submit(process_batch, i, batch): i for i, batch in enumerate(batches)}
    for count, future in enumerate(concurrent.futures.as_completed(futures), 1):
        idx, data = future.result()
        if data:
            results.append((idx, data))
            
            print(f"\n\033[1;36m{'='*60}\033[0m")
            print(f"\033[1;36m🌟 BATCH {idx+1}/{len(batches)} COMPLETED 🌟\033[0m")
            print(f"\033[1;36m{'='*60}\033[0m")
            
            for i, r in enumerate(data.get("reviews_analysis", [])):
                orig_text = r.get("original_review", "N/A")
                emotion = r.get('emotion', 'Unknown')
                conf = r.get('confidence_score', 0.0)
                
                # Colors
                color = "\033[92m" if "positive" in str(emotion).lower() else "\033[91m" if "negative" in str(emotion).lower() else "\033[93m"
                reset = "\033[0m"
                
                print(f"📝 \033[1mReview:\033[0m \"{orig_text}\"")
                print(f"📊 \033[1mEmotion:\033[0m {color}{emotion}{reset} | \033[1mConfidence:\033[0m {conf}")
                
                for aspect in r.get("aspects", []):
                    feature = aspect.get("feature", "N/A").lower().strip()
                    sentiment = aspect.get("sentiment", "N/A").lower().strip()
                    
                    asp_color = "\033[92m" if "positive" in str(sentiment) else "\033[91m" if "negative" in str(sentiment) else "\033[93m"
                    print(f"   • {feature}: {asp_color}{sentiment}{reset}")
                    
                    if sentiment == "negative":
                        # Cleaning
                        if "battery" in feature: feature = "battery"
                        if "customer" in feature or "service" in feature: feature = "customer service"
                        if "keyboard" in feature: feature = "keyboard"
                        if "wifi" in feature or "wi-fi" in feature: feature = "wifi"
                        if "update" in feature or "brick" in feature: feature = "software updates"
                        if "heat" in feature or "overheat" in feature: feature = "overheating"
                        if "price" in feature: feature = "price"
                        if "delivery" in feature: feature = "delivery"
                        negative_aspects.append(feature)
                print("\033[90m" + "-" * 40 + "\033[0m")
        else:
            print(f"❌ Batch {idx+1} failed.")

print("\n--- PLOTTING DATA ---")
if negative_aspects:
    counts = Counter(negative_aspects)
    top_negative = counts.most_common(10)
    
    aspects, freqs = zip(*top_negative)
    
    plt.figure(figsize=(10, 6))
    bars = plt.bar(aspects, freqs, color='#e74c3c')
    
    # Add titles and labels
    plt.title('Top Negative Aspects Mentioned in Customer Reviews\n(AI Analyzed)', fontsize=14, pad=15)
    plt.xlabel('Reported Issue Feature', fontsize=12)
    plt.ylabel('Number of Occurrences', fontsize=12)
    plt.xticks(rotation=45, ha="right", fontsize=10)
    
    # Add count labels on top of the bars
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.5, yval, ha='center', va='bottom')

    # Save to disk
    # We use bbox_inches to ensure the rotated labels don't get cut off
    plt.tight_layout()
    plt.savefig('negative_aspects.png', bbox_inches='tight', dpi=300)
    print("\nVisual plot generated successfully!")
    print("Open 'negative_aspects.png' in this folder to see the results.")
            
else:
    print("No negative aspects were found by the AI!")

# Save to JSON for the frontend
print("\n--- SAVING JSON EXPORT ---")
results.sort(key=lambda x: x[0])
final_output = {
    "total_analyzed": 0,
    "reviews": []
}

for idx, data in results:
    if data:
        for r in data.get("reviews_analysis", []):
            orig = r.get("original_review", "")
            
            # Parse out the structured data we injected earlier
            product_name = "Unknown"
            date_val = "Unknown"
            loc = "Unknown"
            clean_review = orig
            
            if "Product: " in orig and "Review: " in orig:
                try:
                    parts = orig.split("\n")
                    product_name = parts[0].replace("Product: ", "")
                    date_val = parts[1].replace("Date: ", "")
                    loc = parts[2].replace("Location: ", "")
                    clean_review = orig.split("Review: ")[1]
                except Exception:
                    pass
            
            structured_review = {
                "product": product_name,
                "date": date_val,
                "location": loc,
                "review_text": clean_review,
                "emotion": r.get("emotion", "Unknown"),
                "confidence_score": r.get("confidence_score", 0.0),
                "aspects": r.get("aspects", [])
            }
            final_output["reviews"].append(structured_review)

final_output["total_analyzed"] = len(final_output["reviews"])

with open("analyzed_reviews_output.json", "w", encoding="utf-8") as f:
    json.dump(final_output, f, indent=4, ensure_ascii=False)
    
print("💾 Saved ALL AI analysis to 'analyzed_reviews_output.json' for your frontend!")
