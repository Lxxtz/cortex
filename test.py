import requests
import json
import matplotlib.pyplot as plt
from collections import Counter
import sys

URL = "http://localhost:8001/analyze_reviews"

# Dynamic Generation of 100 complex, realistic reviews
def generate_100_reviews():
    import random
    # Seed the random generator so we produce the EXACT SAME 100 reviews every time you run test.py.
    # This allows you to truly see the persistent RAG Cache instantly intercepting reviews across server restarts!
    random.seed(42)
    
    intros = [
        "I've been using this for a month.", "Just got this yesterday.", "First impressions are mixed.", 
        "Honestly, I had high hopes.", "This is a solid machine overall.", "After heavy daily use,"
    ]
    
    pros = [
        "The OLED screen is gorgeous and vivid.", "Keyboard travel is surprisingly deep and satisfying.", 
        "The glass trackpad is buttery smooth.", "Battery life easily gets me through a full 10-hour workday.", 
        "Build quality feels premium and the aluminum chassis is sturdy.", "The speakers are incredibly loud and clear."
    ]
    
    cons = [
        "However, the bottom gets uncomfortably hot under load.", "But the fans sound like a literal jet engine when gaming.", 
        "The wifi keeps dropping randomly every few hours.", "Unfortunately, the webcam resolution is stuck in 2010.", 
        "Customer service was an absolute nightmare when I asked a simple warranty question.", "The hinge is way too stiff."
    ]
    
    sarcastic = [
        "Oh, and I just *love* how it dies at 20% without warning. Brilliant feature.",
        "10/10 would definitely recommend if you enjoy using a $2000 space heater in the summer.",
        "So innovative of them to put the webcam looking right up my nose. Great angle.",
        "Perfect device if your ultimate goal is to spend 3 hours a day fighting with bluetooth drivers.",
        "Wow, the screen glare is amazing—I can use it as a vanity mirror instead of a laptop!"
    ]
    
    neutrals = [
        "Port selection is just okay, nothing to write home about.", "The charger is a bit bulky but manageable.", 
        "Boot time is standard for this price range.", "Weight is fine, not too heavy but not ultra-light.", 
        "It gets the job done for basic office tasks."
    ]
    
    reviews = []
    
    # 1. Complex Mixed Reviews (Intro + Pro + Con + Sarcastic)
    for _ in range(25):
        reviews.append(f"{random.choice(intros)} {random.choice(pros)} {random.choice(cons)} {random.choice(sarcastic)}")
        
    # 2. Mostly Positive (Intro + Pro + Pro + Neutral)
    for _ in range(25):
        p1, p2 = random.sample(pros, 2)
        reviews.append(f"{random.choice(intros)} {p1} {p2} {random.choice(neutrals)}")
        
    # 3. Mostly Negative (Intro + Con + Con + Sarcastic)
    for _ in range(25):
        c1, c2 = random.sample(cons, 2)
        reviews.append(f"{random.choice(intros)} {c1} {c2} {random.choice(sarcastic)}")
        
    # 4. Balanced (Intro + Pro + Con + Neutral)
    for _ in range(25):
        reviews.append(f"{random.choice(intros)} {random.choice(pros)} {random.choice(cons)} {random.choice(neutrals)}")
        
    # Shuffle the base 100 reviews
    random.shuffle(reviews)
    
    # Introduce 15 semantic clones (slight spelling/grammar variations of existing reviews)
    # The RAG layer will instantly recognize these as >95% similar and pull them from cache!
    cache_clones = []
    for i in range(15):
        base = reviews[i]
        clone = base.replace("is", "is absolutely") if "is" in base else base + " Overall, it's fine."
        cache_clones.append(clone)
        
    reviews.extend(cache_clones)
    random.shuffle(reviews)
    
    return reviews[:100]

reviews = generate_100_reviews()

print(f"Total reviews queued for AI parsing: {len(reviews)}")

# We reduced the batch size to 2 so the massive 7B model can return results much faster!
batch_size = 2
negative_aspects = []

print(f"Sending reviews to API in batches of {batch_size} (This will take a bit for the 7B model)...")
for i in range(0, len(reviews), batch_size):
    batch = reviews[i:i+batch_size]
    print(f"Processing batch {i//batch_size + 1}/{(len(reviews))//batch_size}...")
    try:
        response = requests.post(URL, json={"reviews": batch})
        response.raise_for_status()
        data = response.json()
        
        print(f"\n\033[1;36m{'='*60}\033[0m")
        print(f"\033[1;36m🌟 BATCH {i//batch_size + 1} GLOBAL SUMMARY 🌟\033[0m")
        print(f"\033[1;36m{'='*60}\033[0m")
        print(f"\033[3m{data.get('global_summary')}\033[0m")
        print(f"\n\033[1;35m{'='*60}\033[0m")
        print(f"\033[1;35m📋 BATCH REVIEW BREAKDOWN 📋\033[0m")
        print(f"\033[1;35m{'='*60}\033[0m\n")
        
        for idx, r in enumerate(data.get("reviews_analysis", [])):
            original_rev = r.get('original_review', batch[idx] if idx < len(batch) else "N/A")
            emotion = r.get('emotion', 'Unknown')
            conf = r.get('confidence_score', 'N/A')
            
            # Using ANSI colors for beautification
            color = "\033[92m" if "positive" in str(emotion).lower() else "\033[91m" if "negative" in str(emotion).lower() else "\033[93m"
            reset = "\033[0m"
            
            print(f"📝 \033[1mReview {r.get('id', idx+1)}\033[0m: \"{original_rev}\"")
            print(f"📊 \033[1mEmotion\033[0m: {color}{emotion}{reset} | \033[1mConfidence\033[0m: \033[1;33m{conf}{reset}")
            print("🔍 \033[1mAspects\033[0m:")
            for aspect in r.get("aspects", []):
                # Print to terminal beautifully
                feature = aspect.get('feature')
                raw_sentiment = aspect.get('sentiment', '')
                asp_color = "\033[92m" if "positive" in str(raw_sentiment).lower() else "\033[91m" if "negative" in str(raw_sentiment).lower() else "\033[93m"
                print(f"   • {feature}: {asp_color}{raw_sentiment}{reset}")
                
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
            print("\033[90m" + "-" * 60 + "\033[0m")
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
