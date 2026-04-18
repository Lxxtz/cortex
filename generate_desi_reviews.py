import json
import os
import random
from datetime import datetime, timedelta

products = ["Mamaearth Onion Shampoo", "Mamaearth Ubtan Facewash"]

# Desi / Hinglish snippets
shampoo_pos = [
    "Baal bohot soft ho gaye, maza aa gaya!",
    "Hairfall control ekdum mast hai, really love the smell.",
    "Bhai, ye shampoo toh magic hai, no chemicals.",
    "Best onion shampoo in the market, baal shine kar rahe hain.",
    "Khushboo bohot achi hai, bilkul natural feel hota hai.",
    "Jhakaas result! Dandruff chala gaya pichle 2 wash mein.",
    "Sasta aur tikau, works better than expensive ones.",
    "My mom loves it, unke baal kaafi ghane lag rahe hain ab."
]

shampoo_neg = [
    "Baal aur jhadne lage yaar, totally bakwas.",
    "Bohot dry kar deta hai hair ko, frizz control zero.",
    "Smell thodi ajeeb hai, bilkul aam jaisi.",
    "Pump is broken! Delivery wale ne tod diya.",
    "Price thoda high hai quantity ke hisaab se, not paisa vasool.",
    "Bhai baal jhaadu ban gaye, sasta wala dove hi theek tha.",
    "Gimmick hai bas, hairfall ruka hi nahi."
]

face_pos = [
    "Skin glow karne lagi hai, tan remove ho gaya finally.",
    "Face pe ekdum thanda feel hota hai, best for summer.",
    "Bohot refreshing! Haldi aur chandan ki smell mast hai.",
    "Pimple kam ho gaye, meri oily skin ke liye best hai.",
    "Bhai natural glow aa gaya, no need for makeup.",
    "Maza aa gaya dho ke, feel like fresh mogra.",
    "Paisa vasool face wash, quantity achi hai."
]

face_neg = [
    "Skin bohot dry ho gayi, tight feel ho raha hai.",
    "Pimples aur badh gaye, suitable nahi hai sensitive skin ko.",
    "Packaging bekaar hai, tube leak karti hai travel mein.",
    "Scrub particles bohot harsh hain, chubhte hain skin pe.",
    "Gora nahi karta bhai, sab jhooth hai marketing ka.",
    "Smell itni strong hai sir dard ho jata hai.",
    "Behas mehenga hai, normal himalaya wala better lagta hai."
]

locations = ["Mumbai, IND", "Delhi, IND", "Bangalore, IND", "Pune, IND", "Chennai, IND", "Jaipur, IND"]

def generate_reviews(product, pos_texts, neg_texts, num=100):
    reviews = []
    for i in range(num):
        is_pos = random.random() > 0.4 # 60% positive
        text = random.choice(pos_texts) if is_pos else random.choice(neg_texts)
        
        emotion = "Positive" if is_pos else "Negative"
        conf = round(random.uniform(0.75, 0.99), 2)
        
        date = (datetime.now() - timedelta(days=random.randint(1, 365))).strftime("%d %B %Y")
        loc = random.choice(locations)
        
        aspects = []
        # basic aspect mapping
        if "dry" in text.lower() or "glow" in text.lower() or "soft" in text.lower():
            aspects.append({"feature": "effect", "sentiment": emotion})
        if "hairfall" in text.lower() or "pimple" in text.lower() or "tan" in text.lower():
            aspects.append({"feature": "results", "sentiment": emotion})
        if "smell" in text.lower() or "khushboo" in text.lower():
            aspects.append({"feature": "fragrance", "sentiment": emotion})
        if "price" in text.lower() or "vasool" in text.lower() or "sasta" in text.lower():
            aspects.append({"feature": "price", "sentiment": emotion})
        if "pump" in text.lower() or "leak" in text.lower() or "packaging" in text.lower():
            aspects.append({"feature": "packaging", "sentiment": emotion})
            
        if not aspects:
            aspects.append({"feature": "quality", "sentiment": emotion})
            
        reviews.append({
            "product": product,
            "date": date,
            "location": loc,
            "review_text": text,
            "emotion": emotion,
            "confidence_score": conf,
            "aspects": aspects
        })
    return reviews

def main():
    json_path = os.path.join("frontend", "src", "data.json")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    shampoo_reviews = generate_reviews(products[0], shampoo_pos, shampoo_neg, 100)
    face_reviews = generate_reviews(products[1], face_pos, face_neg, 100)
    
    data['reviews'].extend(shampoo_reviews)
    data['reviews'].extend(face_reviews)
    data['total_analyzed'] = len(data['reviews'])
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
    print(f"Added 200 desi reviews. Total reviews: {len(data['reviews'])}")

if __name__ == "__main__":
    main()
