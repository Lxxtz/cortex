import requests
import json
import matplotlib.pyplot as plt
from collections import Counter
import sys

URL = "http://localhost:8001/analyze_reviews"

# Our base template of ~10 mixed complex/sarcastic reviews
base_reviews = [
    "I absolutely love the screen on this laptop, it's so bright and vivid. But the battery life is terrible. I have to charge it after just 3 hours of use.",
    "This is okay. The design is sleek and it runs my games decently well. Customer service was really rude when I asked about warranty though.",
    "Do not buy! It overheats constantly and the keyboard feels very cheap. Waste of money.",
    "Oh brilliant, another software update that completely bricked my device. Just what I wanted for my birthday. 10/10 would buy a paperweight again.",
    "Wow, I just *love* having to hold my laptop at a 45 degree angle to get the WiFi to connect. Such an innovative feature!",
    "The delivery took 3 weeks. Absolutely unacceptable. However, the speakers actually sound phenomenal, so I'm conflicted.",
    "Battery lasts exactly 15 minutes. Perfect! Just enough time to cry about how much money I spent on this.",
    "Honestly, it's a solid piece of tech. The trackpad is buttery smooth and the screen is beautiful. No complaints at all!",
    "Customer service hung up on me. Keyboard keys got stuck on day two. Garbage.",
    "Great product overall, but the price is a little too steep for what it offers."
]

# Generate exactly 100 reviews uniformly
reviews = []
for i in range(10):
    reviews.extend(base_reviews)

print(f"Total reviews queued for AI parsing: {len(reviews)}")

# We send them in small batches so we don't blow up the local AI's prompt context limit
batch_size = 5
negative_aspects = []

print(f"Sending reviews to API in batches of {batch_size} (This will take a few minutes on CPU)...")
for i in range(0, len(reviews), batch_size):
    batch = reviews[i:i+batch_size]
    print(f"Processing batch {i//batch_size + 1}/{(len(reviews))//batch_size}...")
    try:
        response = requests.post(URL, json={"reviews": batch})
        response.raise_for_status()
        data = response.json()
        
        print(f"\n--- BATCH {i//batch_size + 1} GLOBAL SUMMARY ---")
        print(data.get("global_summary"))
        print("\n--- BATCH REVIEW BREAKDOWN ---")
        
        for r in data.get("reviews_analysis", []):
            print(f"Emotion: {r.get('emotion')}")
            print("Aspects:")
            for aspect in r.get("aspects", []):
                # Print to terminal exactly like before
                print(f"  - {aspect.get('feature')}: {aspect.get('sentiment')}")
                
                # Standardize the output string so variations group together properly for the graph
                sentiment = aspect.get("sentiment", "").lower().strip()
                if sentiment == "negative":
                    feature = aspect.get("feature", "").lower().strip()
                    # Some data cleaning
                    if "battery" in feature: feature = "battery"
                    if "customer" in feature or "service" in feature: feature = "customer service"
                    if "keyboard" in feature: feature = "keyboard"
                    if "wifi" in feature or "wi-fi" in feature: feature = "wifi"
                    if "update" in feature or "brick" in feature: feature = "software updates"
                    if "heat" in feature or "overheat" in feature: feature = "overheating"
                    if "price" in feature: feature = "price"
                    if "delivery" in feature: feature = "delivery"

                    negative_aspects.append(feature)
    except Exception as e:
        print(f"Batch failed: {e}")

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
