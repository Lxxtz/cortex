import json

def generate_bi_intelligence():
    print("Loading analyzed reviews...")
    with open("frontend/src/data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # Mock parameters for the Cost Engine and Severity
    COST_TABLE = {
        "Display": 150.0,
        "Performance": 80.0,
        "Battery": 145.0,
        "Audio": 40.0,
        "Ergonomics": 20.0,
        "Build/Design": 60.0,
        "Software/Connectivity": 15.0,
        "Input": 30.0,
        "Hardware": 100.0,
        "Usability/Maintenance": 5.0,
        "Pricing": 0.0,
        "Safety": 500.0,
        "Other": 10.0
    }

    SEVERITY_TABLE = {
        "Display": 9,
        "Performance": 8,
        "Battery": 9,
        "Audio": 6,
        "Ergonomics": 5,
        "Build/Design": 7,
        "Software/Connectivity": 6,
        "Input": 6,
        "Hardware": 7,
        "Usability/Maintenance": 3,
        "Pricing": 3,
        "Safety": 10,
        "Other": 4
    }

    def categorize_aspect(feature):
        f = feature.lower()
        if any(x in f for x in ['display', 'screen', 'graphic', 'oled', 'vivid', 'notch']): return "Display"
        if any(x in f for x in ['performance', 'suction', 'cool', 'grind', 'steam', 'temp', 'motor', 'curl', 'odor', 'chip', 'ram']): return "Performance"
        if any(x in f for x in ['battery', 'power', 'range', 'drain']): return "Battery"
        if any(x in f for x in ['audio', 'sound', 'mic', 'anc', 'bass', 'noise']): return "Audio"
        if any(x in f for x in ['ergonomic', 'comfort', 'weight', 'size', 'sizing', 'cushion', 'lumbar', 'armrest']): return "Ergonomics"
        if any(x in f for x in ['build', 'design', 'durability', 'lace', 'mesh', 'hinge', 'case', 'frame']): return "Build/Design"
        if any(x in f for x in ['software', 'app', 'autopilot', 'ipados', 'ai', 'bug', 'connect', 'wifi']): return "Software/Connectivity"
        if any(x in f for x in ['input', 'control', 'drift', 'pencil', 'keyboard', 'trackpad']): return "Input"
        if any(x in f for x in ['hardware', 'sensor', 'laser', 'suspension', 'storage', 'gauge', 'attachment', 'port', 'usb']): return "Hardware"
        if any(x in f for x in ['use', 'clean', 'learn', 'maintenance']): return "Usability/Maintenance"
        if any(x in f for x in ['price', 'cost', 'money', 'value']): return "Pricing"
        if any(x in f for x in ['safe', 'heat', 'burn']): return "Safety"
        return feature.title() # Fallback to raw feature name if no cluster matches

    bi_data = {}

    print("Running Issue Normalization & Clustering...")
    for review in data["reviews"]:
        product = review["product"]
        if product not in bi_data:
            bi_data[product] = {}
            
        # Sentiment Intensity is derived from the AI's confidence score
        intensity = review.get("confidence_score", 0.5)
        
        for aspect in review.get("aspects", []):
            if aspect["sentiment"].lower() == "negative":
                cluster = categorize_aspect(aspect["feature"])
                
                if cluster not in bi_data[product]:
                    bi_data[product][cluster] = {
                        "count": 0,
                        "total_intensity": 0.0,
                        "severity": SEVERITY_TABLE.get(cluster, 5),
                        "cost_per_unit": COST_TABLE.get(cluster, 25.0)
                    }
                    
                bi_data[product][cluster]["count"] += 1
                bi_data[product][cluster]["total_intensity"] += intensity

    print("Running Impact Scoring & Cost Engine...")
    final_bi = []
    for product, clusters in bi_data.items():
        for cluster, metrics in clusters.items():
            if metrics["cost_per_unit"] <= 0: 
                continue # Skip unfixable issues like weight or price
            
            count = metrics["count"]
            avg_intensity = metrics["total_intensity"] / count
            severity = metrics["severity"]
            cost_per_unit = metrics["cost_per_unit"]
            
            # FORMULAS:
            impact_score = count * severity * avg_intensity
            estimated_cost = count * cost_per_unit
            roi_score = impact_score / estimated_cost if estimated_cost > 0 else 0
                
            final_bi.append({
                "product": product,
                "issue_cluster": cluster.title(),
                "frequency": count,
                "severity": severity,
                "avg_intensity": round(avg_intensity, 2),
                "impact_score": round(impact_score, 2),
                "estimated_cost": round(estimated_cost, 2),
                "roi_score": round(roi_score, 4)
            })

    # Sort by ROI score descending to highlight highest priority fixes
    final_bi.sort(key=lambda x: x["roi_score"], reverse=True)

    with open("frontend/src/bi_data.json", "w", encoding="utf-8") as f:
        json.dump(final_bi, f, indent=4)
        
    print(f"Successfully generated BI Intelligence Data! Total Issue Clusters: {len(final_bi)}")

if __name__ == "__main__":
    generate_bi_intelligence()
