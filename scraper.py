from playwright.sync_api import sync_playwright
import json
import time
import re

def scrape_amazon_tech(page, product_name, target_count=100):
    print(f"\n[*] Searching Amazon for '{product_name}'...")
    search_url = f"https://www.amazon.in/s?k={product_name.replace(' ', '+')}"
    
    reviews_data = []
    
    try:
        page.goto(search_url, timeout=60000)
        time.sleep(3)
        
        if "captcha" in page.title().lower() or page.locator("form[action='/errors/validateCaptcha']").is_visible():
            print("[-] CAPTCHA hit. Skipping.")
            return []
            
        product_link = page.locator('a.a-link-normal.s-no-outline:not([href*="/sspa/"])').first
        if not product_link.is_visible():
            product_link = page.locator('a.a-text-normal:not([href*="/sspa/"])').first
            if not product_link.is_visible():
                print(f"[-] Could not find product: {product_name}")
                return []
                
        href = product_link.get_attribute('href')
        product_url = "https://www.amazon.in" + href
        print(f"[*] Found Product. Navigating to: {product_url.split('?')[0]}")
        
        page.goto(product_url, timeout=60000)
        time.sleep(3)
        
        page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)")
        time.sleep(2)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(2)
        
        see_all = page.locator('a[data-hook="see-all-reviews-link-foot"]')
        if see_all.is_visible():
            see_all.click()
            time.sleep(4)
        else:
            print("[-] Could not find 'See all reviews' link. Product might not have enough reviews.")
            return []
        
        # Scrape pages until we hit target
        for p in range(20): # Up to 20 pages max
            if len(reviews_data) >= target_count:
                break
                
            review_blocks = page.locator('div[data-hook="review"]')
            count = review_blocks.count()
            
            for i in range(count):
                if len(reviews_data) >= target_count:
                    break
                    
                block = review_blocks.nth(i)
                text_loc = block.locator('span[data-hook="review-body"]')
                date_loc = block.locator('span[data-hook="review-date"]')
                
                if text_loc.is_visible() and date_loc.is_visible():
                    text = text_loc.inner_text().strip()
                    date_str = date_loc.inner_text().strip()
                    
                    # Example date_str: "Reviewed in India on 12 March 2024"
                    location = "Unknown"
                    date_val = "Unknown"
                    match = re.search(r'Reviewed in (.*?) on (.*)', date_str)
                    if match:
                        location = match.group(1).strip()
                        date_val = match.group(2).strip()
                        
                    # Skip empty or duplicate reviews
                    if text and text not in [r["review"] for r in reviews_data]:
                        reviews_data.append({
                            "product": product_name,
                            "review": text,
                            "date": date_val,
                            "location": location
                        })
            
            print(f"[+] {product_name}: Collected {len(reviews_data)}/{target_count} reviews...")
            
            next_btn = page.locator('li.a-last a')
            if next_btn.is_visible() and not 'a-disabled' in next_btn.evaluate("el => el.parentElement.className"):
                next_btn.click()
                time.sleep(3)
            else:
                break
                
        return reviews_data
        
    except Exception as e:
        print(f"[-] Scraper Error: {e}")
        return reviews_data

if __name__ == "__main__":
    print("==================================================")
    print(" 🛒 Tech Product Review Multi-Scraper")
    print("==================================================")
    
    # 3 Distinct Tech Products
    products_to_scrape = [
        "Apple MacBook Air M2",
        "Sony WH-1000XM5 Wireless Headphones",
        "Samsung Galaxy S24 Ultra"
    ]
    
    all_reviews = []
    
    print("\n[!] Launching invisible Chromium browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        for product in products_to_scrape:
            data = scrape_amazon_tech(page, product, target_count=100)
            all_reviews.extend(data)
            
        browser.close()
    
    output_file = "tech_reviews.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_reviews, f, indent=4, ensure_ascii=False)
        
    print(f"\n[🚀] Done! Saved total {len(all_reviews)} reviews across {len(products_to_scrape)} products to '{output_file}'.")
