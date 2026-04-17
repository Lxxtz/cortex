import json
import random
import datetime
import os

PRODUCTS = ["Mamaearth Sunscreen", "Tropicana Mixed Fruit Juice", "Lays Chips"]
LOCATIONS = ["Delhi, IND", "Mumbai, IND", "Bangalore, IND", "Pune, IND", "Hyderabad, IND", "Chennai, IND", "Kolkata, IND", "Gurgaon, IND"]

mamaearth_reviews_pool = [
    ("The texture is amazing, leaves no white cast. Skin ekdum glow karti hai!", "Positive", [{"feature": "texture", "sentiment": "Positive"}, {"feature": "white cast", "sentiment": "Positive"}]),
    ("Very oily for my skin. Pimple nikal aaye after using this.", "Negative", [{"feature": "oiliness", "sentiment": "Negative"}, {"feature": "breakouts", "sentiment": "Negative"}]),
    ("Smell is very good, but it makes me sweat a lot in summer. Thoda sticky lagta hai.", "Mixed", [{"feature": "smell", "sentiment": "Positive"}, {"feature": "sweat", "sentiment": "Negative"}, {"feature": "texture", "sentiment": "Negative"}]),
    ("Perfect for Indian weather. Sasta aur tikau product. Will definitely buy again.", "Positive", [{"feature": "price", "sentiment": "Positive"}, {"feature": "suitability", "sentiment": "Positive"}]),
    ("Bohot hi bakwas. Doesn't protect from tan at all. Totally waste of money.", "Negative", [{"feature": "protection", "sentiment": "Negative"}, {"feature": "price", "sentiment": "Negative"}]),
    ("It's decent. Not too great, not too bad. Kaam chalau hai.", "Neutral", [{"feature": "overall quality", "sentiment": "Neutral"}]),
    ("Love the packaging, but quantity is very less for the price.", "Mixed", [{"feature": "packaging", "sentiment": "Positive"}, {"feature": "quantity", "sentiment": "Negative"}, {"feature": "price", "sentiment": "Negative"}]),
    ("Maza aa gaya! Best sunscreen I have used so far. Lightweight and absorbs fast.", "Positive", [{"feature": "weight", "sentiment": "Positive"}, {"feature": "absorption", "sentiment": "Positive"}]),
    ("Got an allergic reaction. Meri skin red ho gayi. Please do patch test.", "Negative", [{"feature": "reaction", "sentiment": "Negative"}, {"feature": "safety", "sentiment": "Negative"}]),
    ("Ingredients are natural which is a plus, but application is not smooth.", "Mixed", [{"feature": "ingredients", "sentiment": "Positive"}, {"feature": "application", "sentiment": "Negative"}]),
    ("Accha hai but not for dry skin. Winter me skin bohot dry lagti hai.", "Negative", [{"feature": "suitability", "sentiment": "Negative"}, {"feature": "hydration", "sentiment": "Negative"}]),
    ("Bhai, white cast toh chhodta hai. Face looks like a ghost if applied too much.", "Negative", [{"feature": "white cast", "sentiment": "Negative"}]),
    ("Good for daily use indoors. I like the mild fragrance.", "Positive", [{"feature": "daily use", "sentiment": "Positive"}, {"feature": "fragrance", "sentiment": "Positive"}]),
    ("Too thick and greasy. Chip chip hota hai pura din.", "Negative", [{"feature": "thickness", "sentiment": "Negative"}, {"feature": "greasiness", "sentiment": "Negative"}]),
    ("Awesome product! Gives a nice dewy finish. Everyone asks me about my glow.", "Positive", [{"feature": "finish", "sentiment": "Positive"}]),
]

tropicana_reviews_pool = [
    ("Tastes very natural. Asli fruit ka taste aata hai unlike other brands.", "Positive", [{"feature": "taste", "sentiment": "Positive"}, {"feature": "naturalness", "sentiment": "Positive"}]),
    ("Too much added sugar. Bohot meetha hai, feels unhealthy.", "Negative", [{"feature": "sugar content", "sentiment": "Negative"}, {"feature": "healthiness", "sentiment": "Negative"}]),
    ("Kids love it! Packaging is nice, but pure juice nahi lagta.", "Mixed", [{"feature": "packaging", "sentiment": "Positive"}, {"feature": "authenticity", "sentiment": "Negative"}]),
    ("Perfect for breakfast. Refreshing and tastes good when chilled. Ekdum mast!", "Positive", [{"feature": "taste", "sentiment": "Positive"}, {"feature": "refreshment", "sentiment": "Positive"}]),
    ("Sirf sugar syrup hai bhai. No real fruit pulp inside.", "Negative", [{"feature": "ingredients", "sentiment": "Negative"}, {"feature": "authenticity", "sentiment": "Negative"}]),
    ("Good to mix with other drinks. Aise hi peene me thoda thick lagta hai.", "Mixed", [{"feature": "versatility", "sentiment": "Positive"}, {"feature": "thickness", "sentiment": "Negative"}]),
    ("Value for money. Bada pack family ke liye best hai.", "Positive", [{"feature": "price", "sentiment": "Positive"}, {"feature": "packaging", "sentiment": "Positive"}]),
    ("Taste change ho gaya hai. Pehle zyada better lagta tha.", "Negative", [{"feature": "taste", "sentiment": "Negative"}]),
    ("Thik thak hai. Sometimes feels like artificial flavour is too strong.", "Neutral", [{"feature": "flavour", "sentiment": "Negative"}]),
    ("Best mixed fruit juice in the market! Sab fruits ka balance accha hai.", "Positive", [{"feature": "taste", "sentiment": "Positive"}, {"feature": "balance", "sentiment": "Positive"}]),
    ("Received expired product! Very disappointed.", "Negative", [{"feature": "freshness", "sentiment": "Negative"}]),
    ("Sweetness is perfect for me. Fridge me rakh ke peeyo toh heaven lagta hai.", "Positive", [{"feature": "sweetness", "sentiment": "Positive"}, {"feature": "taste", "sentiment": "Positive"}]),
    ("Not 100% juice, read the label. Contains preservatives.", "Negative", [{"feature": "ingredients", "sentiment": "Negative"}]),
    ("Good alternative to cold drinks when guests arrive.", "Positive", [{"feature": "utility", "sentiment": "Positive"}]),
    ("Overpriced. Local juice wala fresh juice sasta deta hai.", "Negative", [{"feature": "price", "sentiment": "Negative"}]),
]

lays_reviews_pool = [
    ("Magic Masala is the GOAT! Nothing beats the blue packet.", "Positive", [{"feature": "flavour", "sentiment": "Positive"}]),
    ("Packet is 80% air and 20% chips. Hawa bech rahe hain ye log.", "Negative", [{"feature": "quantity", "sentiment": "Negative"}, {"feature": "packaging", "sentiment": "Negative"}]),
    ("American Cream and Onion is best, but lately chips bohot chote aa rahe hain.", "Mixed", [{"feature": "flavour", "sentiment": "Positive"}, {"feature": "chip size", "sentiment": "Negative"}]),
    ("Perfect for movie nights. Crunchiness is perfect. Ek packet me dil nahi bharta.", "Positive", [{"feature": "crunchiness", "sentiment": "Positive"}, {"feature": "taste", "sentiment": "Positive"}]),
    ("Classic salted is too salty sometimes. BP badha dega ye.", "Negative", [{"feature": "saltiness", "sentiment": "Negative"}]),
    ("Spanish Tomato Tango is my childhood favourite. Still love the sweet and sour taste.", "Positive", [{"feature": "flavour", "sentiment": "Positive"}, {"feature": "taste", "sentiment": "Positive"}]),
    ("Bohot zyada tel hota hai inme. Fingers become so oily after eating.", "Negative", [{"feature": "oiliness", "sentiment": "Negative"}]),
    ("Love the new flavours, but availability is an issue at local stores.", "Mixed", [{"feature": "flavour", "sentiment": "Positive"}, {"feature": "availability", "sentiment": "Negative"}]),
    ("Chai ke saath Lays is the ultimate combo. Best snack ever.", "Positive", [{"feature": "pairing", "sentiment": "Positive"}, {"feature": "taste", "sentiment": "Positive"}]),
    ("Stale chips! Seel gaye the packets ke andar. Terrible experience.", "Negative", [{"feature": "freshness", "sentiment": "Negative"}, {"feature": "crunchiness", "sentiment": "Negative"}]),
    ("Wafer thin and super crispy. Always my go-to travel snack.", "Positive", [{"feature": "texture", "sentiment": "Positive"}, {"feature": "crispiness", "sentiment": "Positive"}]),
    ("Price badha diya aur quantity kam kar di. Not worth 20 rupees anymore.", "Negative", [{"feature": "price", "sentiment": "Negative"}, {"feature": "quantity", "sentiment": "Negative"}]),
    ("Good crunch but artificial flavours taste too synthetic.", "Mixed", [{"feature": "crunchiness", "sentiment": "Positive"}, {"feature": "flavour", "sentiment": "Negative"}]),
    ("Blue lays forever! The masala distribution is chef's kiss.", "Positive", [{"feature": "flavour", "sentiment": "Positive"}, {"feature": "seasoning", "sentiment": "Positive"}]),
    ("Found burnt chips in my packet. Quality control kahan hai?", "Negative", [{"feature": "quality control", "sentiment": "Negative"}, {"feature": "appearance", "sentiment": "Negative"}]),
]

def generate_random_date():
    start_date = datetime.date(2023, 1, 1)
    end_date = datetime.date(2024, 12, 31)
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    random_date = start_date + datetime.timedelta(days=random_number_of_days)
    return random_date.strftime("%d %B %Y")

def main():
    json_path = os.path.join("frontend", "src", "data.json")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    reviews = data.get("reviews", [])
    
    new_reviews = []
    
    pools = {
        "Mamaearth Sunscreen": mamaearth_reviews_pool,
        "Tropicana Mixed Fruit Juice": tropicana_reviews_pool,
        "Lays Chips": lays_reviews_pool
    }
    
    for product in PRODUCTS:
        pool = pools[product]
        for _ in range(100):
            template = random.choice(pool)
            review_text, emotion, aspects = template
            
            # Add slight variation to confidence
            confidence = round(random.uniform(0.75, 0.98), 2)
            
            # Select random location and date
            location = random.choice(LOCATIONS)
            date = generate_random_date()
            
            new_review = {
                "product": product,
                "date": date,
                "location": location,
                "review_text": review_text,
                "emotion": emotion,
                "confidence_score": confidence,
                "aspects": aspects
            }
            new_reviews.append(new_review)
            
    # Append to existing reviews
    data["reviews"].extend(new_reviews)
    data["total_analyzed"] = len(data["reviews"])
    
    # Write back to data.json
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
    print(f"Successfully added 300 new Indian product reviews. Total reviews now: {data['total_analyzed']}")

if __name__ == "__main__":
    main()
