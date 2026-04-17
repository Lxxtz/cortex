import json
import random
from datetime import datetime, timedelta

products = {
    'Dyson V15 Detect Vacuum': {
        'aspects': [
            ('battery life', ['dies quickly', 'only lasts 20 mins', 'battery degradation', 'amazing battery', 'enough for whole house']),
            ('suction power', ['weak suction', 'leaves crumbs', 'insane suction', 'cleans everything']),
            ('weight', ['too heavy', 'hurts my wrist', 'lightweight', 'easy to carry']),
            ('price', ['way too expensive', 'not worth the money', 'good value', 'worth every penny']),
            ('laser attachment', ['laser is a gimmick', 'laser stopped working', 'laser shows all dust', 'brilliant feature'])
        ]
    },
    'Tesla Model Y': {
        'aspects': [
            ('autopilot', ['phantom braking', 'swerves randomly', 'autopilot is dangerous', 'game changer on highway', 'perfect steering']),
            ('build quality', ['panel gaps', 'rattling noise', 'paint chipping', 'solid build', 'feels premium']),
            ('range', ['range anxiety', 'drops fast in winter', 'excellent range', 'supercharging is fast']),
            ('suspension', ['too stiff', 'bumpy ride', 'uncomfortable over potholes', 'smooth ride', 'handles like a sports car']),
            ('screen', ['glitchy screen', 'crashes often', 'beautiful interface', 'responsive UI'])
        ]
    },
    'PlayStation 5 Pro': {
        'aspects': [
            ('cooling', ['overheats', 'sounds like a jet engine', 'fan noise is loud', 'whisper quiet', 'great thermals']),
            ('controller drift', ['stick drift out of box', 'R2 button broke', 'amazing haptics', 'best controller ever']),
            ('storage', ['only 800gb', 'fills up too fast', 'needs expansion', 'plenty of space', 'fast ssd']),
            ('graphics', ['looks the same as base PS5', 'no 60fps mode', 'stunning 4k', 'mind blowing visuals']),
            ('price', ['price gouging', 'no disc drive included', 'good value for pro', 'fair price'])
        ]
    },
    'Nike Air Zoom Pegasus 40': {
        'aspects': [
            ('durability', ['sole peeled off', 'mesh tore', 'holes after 1 month', 'lasts forever', 'built like a tank']),
            ('comfort', ['gives me blisters', 'too narrow', 'hurts my arches', 'like walking on clouds', 'super comfortable']),
            ('sizing', ['runs small', 'too tight', 'order half size up', 'true to size', 'perfect fit']),
            ('cushioning', ['feels flat', 'zoom unit popped', 'great bounce', 'excellent energy return']),
            ('laces', ['laces are too short', 'unties constantly', 'good lockdown', 'secure fit'])
        ]
    },
    'Breville Barista Express': {
        'aspects': [
            ('grinder', ['grinder gets stuck', 'inconsistent grind', "can't dial in", 'perfect espresso', 'grinds beautifully']),
            ('steam wand', ['weak steam pressure', 'takes forever to froth', 'microfoam is perfect', 'powerful steam']),
            ('cleaning', ['pain to clean', "descale light won't turn off", 'easy maintenance', 'self cleaning is great']),
            ('pressure gauge', ['pressure drops', 'broken gauge', 'accurate readings', 'helps dial in']),
            ('temperature', ['coffee is lukewarm', "doesn't get hot enough", 'piping hot', 'perfect extraction temp'])
        ]
    },
    'Herman Miller Aeron Chair': {
        'aspects': [
            ('lumbar support', ['posture fit hurts', 'pokes my back', 'back pain worsened', 'cured my back pain', 'amazing lumbar']),
            ('seat mesh', ['mesh tears clothes', 'cuts off circulation', 'breathable mesh', 'comfortable seat']),
            ('armrests', ['armrests wobble', "won't stay in place", 'highly adjustable', 'perfect positioning']),
            ('price', ['overpriced plastic', 'not worth $1000', 'investment in health', 'worth the premium']),
            ('sizing', ['size B is too small', 'digs into my thighs', 'perfect fit', 'supports my weight well'])
        ]
    },
    'Sony WH-1000XM5 Headphones': {
        'aspects': [
            ('hinge durability', ['hinge snapped', 'cheap plastic', 'broke after 2 months', 'sturdy build', 'feels premium']),
            ('ANC', ['worse than XM4', 'auto ANC is annoying', 'blocks out everything', 'insane noise cancellation']),
            ('comfort', ['headband hurts', 'clamp force too tight', 'ears get hot', 'super lightweight', 'can wear all day']),
            ('microphone', ['calls sound muffled', "people can't hear me", 'crystal clear calls', 'great for meetings']),
            ('sound profile', ['too much bass', 'muddy mids', 'incredible soundstage', 'crisp highs'])
        ]
    },
    'Litter-Robot 4': {
        'aspects': [
            ('sensors', ['sensors get dirty', 'stops mid cycle', 'says full when empty', 'accurate weight tracking', 'flawless sensors']),
            ('odor control', ['smells terrible', "doesn't seal smell", 'completely odorless', 'no more cat smell']),
            ('app connection', ['wifi drops', 'app is buggy', "won't connect to 5ghz", 'great app features', 'useful notifications']),
            ('size', ['globe is too small', "large cats don't fit", 'perfect size', 'takes up less space']),
            ('motor', ['motor died', 'loud cycling noise', 'whisper quiet', 'smooth rotation'])
        ]
    },
    'Dyson Airwrap': {
        'aspects': [
            ('curl hold', ['curls drop in 10 mins', "doesn't hold thick hair", 'curls last all day', 'bouncy blowout']),
            ('heat damage', ['fried my hair', 'gets too hot', 'zero heat damage', 'hair feels healthy']),
            ('attachments', ['barrels are too short', 'attachments fall off', 'versatile tools', 'love the smoothing brush']),
            ('learning curve', ['impossible to use', 'too complicated', 'easy once you learn', 'quick morning routine']),
            ('price', ['insanely overpriced', 'not worth it', 'replaces all my tools', 'good investment'])
        ]
    },
    'Apple iPad Pro M4': {
        'aspects': [
            ('OLED screen', ['grainy screen', 'PWM flickering hurts eyes', 'stunning blacks', 'best display ever']),
            ('battery life', ['drains fast on magic keyboard', 'battery is worse than M2', 'all day battery', 'lasts for days']),
            ('durability', ['bends easily', 'scratches fast', 'incredibly thin but strong', 'solid aluminum build']),
            ('iPadOS', ['software holds it back', "can't code on it", 'multitasking is great', 'smooth OS']),
            ('Apple Pencil Pro', ['squeeze feature is a gimmick', 'randomly disconnects', 'amazing haptic feedback', 'perfect for artists'])
        ]
    }
}

locations = ['New York, USA', 'London, UK', 'Sydney, AUS', 'Toronto, CAN', 'Berlin, GER', 'Tokyo, JPN', 'Dubai, UAE']

def generate_reviews():
    reviews = []
    
    start_date = datetime.now() - timedelta(days=365)
    
    for product, data in products.items():
        aspect_list = data['aspects']
        
        for i in range(100):
            # 60% negative, 20% positive, 20% mixed
            val = random.random()
            if val < 0.6:
                emotion = 'Negative'
                num_aspects = random.randint(1, 3)
            elif val < 0.8:
                emotion = 'Positive'
                num_aspects = random.randint(1, 2)
            else:
                emotion = 'Mixed'
                num_aspects = 2
                
            selected_aspects_data = random.sample(aspect_list, num_aspects)
            
            review_sentences = []
            aspects_output = []
            
            for aspect_name, phrases in selected_aspects_data:
                # Splitting phrases by sentiment loosely
                if emotion == 'Negative':
                    phrase = random.choice(phrases[:2])
                    sentiment = 'Negative'
                elif emotion == 'Positive':
                    phrase = random.choice(phrases[-2:])
                    sentiment = 'Positive'
                else: # Mixed
                    is_pos = random.choice([True, False])
                    phrase = random.choice(phrases[-2:]) if is_pos else random.choice(phrases[:2])
                    sentiment = 'Positive' if is_pos else 'Negative'
                    
                sentence_templates = [
                    f"The {aspect_name} is terrible. {phrase}.",
                    f"I noticed the {aspect_name} {phrase}.",
                    f"{phrase.capitalize()} when it comes to the {aspect_name}.",
                    f"Really disappointed with the {aspect_name}, {phrase}.",
                    f"Love the {aspect_name}! {phrase.capitalize()}.",
                    f"The {aspect_name} feature is exactly what I needed: {phrase}."
                ]
                
                if sentiment == 'Negative':
                    sentence = random.choice(sentence_templates[:4])
                else:
                    sentence = random.choice(sentence_templates[-2:])
                    
                review_sentences.append(sentence)
                aspects_output.append({
                    "feature": aspect_name,
                    "sentiment": sentiment
                })
                
            date_obj = start_date + timedelta(days=random.randint(0, 365))
            
            reviews.append({
                "product": product,
                "date": date_obj.strftime("%d %B %Y"),
                "location": random.choice(locations),
                "review_text": " ".join(review_sentences),
                "emotion": emotion,
                "confidence_score": round(random.uniform(0.75, 0.99), 2),
                "aspects": aspects_output
            })
            
    # Shuffle all reviews
    random.shuffle(reviews)
    
    with open('frontend/src/data.json', 'w') as f:
        json.dump({"total_analyzed": len(reviews), "reviews": reviews}, f, indent=4)
        
    print(f"Generated {len(reviews)} reviews for {len(products)} products.")

generate_reviews()
