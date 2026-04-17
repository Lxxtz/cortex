import json
import os
import random

PRODUCTS = ["Mamaearth Sunscreen", "Tropicana Mixed Fruit Juice", "Lays Chips"]
CLUSTERS = ["Pricing", "Safety", "Performance", "Build/Design", "Usability/Maintenance", "Other"]

def main():
    json_path = os.path.join("frontend", "src", "bi_data.json")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    new_bi = []
    
    for product in PRODUCTS:
        # Create 2-3 BI entries per product
        num_entries = random.randint(2, 4)
        selected_clusters = random.sample(CLUSTERS, num_entries)
        
        for cluster in selected_clusters:
            frequency = random.randint(15, 60)
            severity = random.randint(3, 9)
            avg_intensity = round(random.uniform(0.75, 0.95), 2)
            impact_score = round(frequency * severity * avg_intensity, 2)
            estimated_cost = round(frequency * random.randint(20, 100), 1)
            roi_score = round(impact_score / estimated_cost if estimated_cost > 0 else 0, 4)
            
            new_bi.append({
                "product": product,
                "issue_cluster": cluster,
                "frequency": frequency,
                "severity": severity,
                "avg_intensity": avg_intensity,
                "impact_score": impact_score,
                "estimated_cost": estimated_cost,
                "roi_score": roi_score
            })
            
    # Append to existing BI data
    data.extend(new_bi)
    
    # Sort by roi_score descending (optional, but good for table)
    data.sort(key=lambda x: x.get('roi_score', 0), reverse=True)
    
    # Write back
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
    print(f"Successfully added {len(new_bi)} BI data entries. Total: {len(data)}")

if __name__ == "__main__":
    main()
