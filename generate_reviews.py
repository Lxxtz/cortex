import json
import random
from datetime import datetime, timedelta

def random_date():
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2024, 3, 15)
    delta = end_date - start_date
    random_days = random.randrange(delta.days)
    res = start_date + timedelta(days=random_days)
    return res.strftime("%d %B %Y")

locations = ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "Singapore"]

intros = [
    "I've been using this for a few weeks now.", "Just got this delivered yesterday.", 
    "After reading a ton of reviews, I finally pulled the trigger.", "First impressions are mixed.", 
    "Honestly, I had high hopes.", "This is a solid device overall.", "Upgraded from my old one."
]

sarcastic_comments = [
    "Oh, and I just love how much money I spent on this. Brilliant.",
    "10/10 would recommend if you hate having money in your wallet.",
    "Such an innovative feature to make the battery drain faster. Great job.",
    "Perfect if your ultimate goal is to spend hours fighting with settings.",
    "Wow, it's so heavy I can use it as a dumbell at the gym!"
]

neutrals = [
    "Shipping was fast at least.", "Packaging was standard.", 
    "It gets the job done for the most part.", "Nothing to write home about, it's fine.", 
    "Exactly what you would expect at this price point."
]

# Product specific banks
banks = {
    "Apple MacBook Air M2": {
        "pros": ["M2 chip is blazingly fast.", "Battery life easily gets me through a full 10-hour workday.", 
                 "The midnight color is gorgeous.", "Fanless design means it's dead silent.", "Keyboard is very tactile and deep."],
        "cons": ["Midnight color is a massive fingerprint magnet.", "8GB RAM base model in this day and age is a joke.", 
                 "Only 2 USB-C ports is extremely limiting.", "The notch on the screen is annoying.", "Gets uncomfortably warm during heavy video editing."]
    },
    "Sony WH-1000XM5 Wireless Headphones": {
        "pros": ["ANC is the best on the market hands down.", "Extremely lightweight and comfortable for long sessions.", 
                 "Battery lasts forever on a single charge.", "Microphone quality is a huge step up from the XM4.", "Multipoint connection works flawlessly."],
        "cons": ["Hinge feels flimsy and cheap compared to the older model.", "No longer folds down which makes the carrying case huge.", 
                 "Bass is a bit muddy out of the box without EQ.", "Earcups get sweaty easily in the summer.", "The companion app is clunky."]
    },
    "Samsung Galaxy S24 Ultra": {
        "pros": ["The new anti-reflective screen is an absolute game changer.", "Battery easily lasts 1.5 days with heavy use.", 
                 "Cameras are unbelievable, especially the zoom lens.", "S-Pen is super handy for quick notes.", "Flat screen is finally back, making screen protectors easy!"],
        "cons": ["The phone is a literal brick, it's so heavy.", "Titanium frame scratches surprisingly easily.", 
                 "The AI features feel like a gimmick right now.", "Vivid mode display bug was annoying before the software update.", "Price is absolutely astronomical for a phone."]
    }
}

all_reviews = []

random.seed(101) # For reproducibility

for product, data in banks.items():
    pros = data["pros"]
    cons = data["cons"]
    
    # Generate exactly 100 reviews per product
    for _ in range(100):
        structure_type = random.choice(["mostly_pro", "mostly_con", "balanced", "sarcastic", "short"])
        
        intro = random.choice(intros)
        loc = random.choice(locations)
        date = random_date()
        
        if structure_type == "mostly_pro":
            rev = f"{intro} {random.choice(pros)} {random.choice(pros)} {random.choice(neutrals)}"
        elif structure_type == "mostly_con":
            rev = f"{intro} {random.choice(cons)} {random.choice(cons)} {random.choice(neutrals)}"
        elif structure_type == "balanced":
            rev = f"{intro} {random.choice(pros)} {random.choice(cons)} {random.choice(neutrals)}"
        elif structure_type == "sarcastic":
            rev = f"{intro} {random.choice(cons)} {random.choice(sarcastic_comments)}"
        elif structure_type == "short":
            rev = f"{random.choice(pros)} {random.choice(cons)}"
            
        # Add a tiny bit of random mutation to make them truly unique
        if random.random() < 0.2:
            rev = rev.replace(".", "!")
        if random.random() < 0.2:
            rev = rev.lower()
            
        all_reviews.append({
            "product": product,
            "review": rev,
            "date": date,
            "location": loc
        })

# Shuffle the entire dataset so batches are mixed
random.shuffle(all_reviews)

with open("tech_reviews.json", "w", encoding="utf-8") as f:
    json.dump(all_reviews, f, indent=4, ensure_ascii=False)

print(f"Generated exactly {len(all_reviews)} highly-realistic synthetic reviews across 3 products!")
