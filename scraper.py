from playwright.sync_api import sync_playwright
import json
import time

def scrape_amazon_reviews(page, product_name):
    print(f"[*] Searching Amazon for '{product_name}'...")
    search_url = f"https://www.amazon.in/s?k={product_name.replace(' ', '+')}"
    
    try:
        page.goto(search_url, timeout=60000)
        time.sleep(3)
        
        if "captcha" in page.title().lower() or page.locator("form[action='/errors/validateCaptcha']").is_visible():
            print("[-] Amazon hit us with a CAPTCHA wall. Skipping Amazon.")
            return []
            
        # Find first non-sponsored product link
        # Sponsored links contain '/sspa/' in their href. We MUST skip them!
        product_link = page.locator('a.a-link-normal.s-no-outline:not([href*="/sspa/"])').first
        if not product_link.is_visible():
            # Fallback to text link if image link isn't found
            product_link = page.locator('a.a-text-normal:not([href*="/sspa/"])').first
            if not product_link.is_visible():
                print("[-] Could not find a non-sponsored product on Amazon.")
                return []
            
        href = product_link.get_attribute('href')
        product_url = "https://www.amazon.in" + href
        print(f"[*] Found Amazon Product. Fetching reviews from: {product_url.split('?')[0]}")
        
        page.goto(product_url, timeout=60000)
        time.sleep(3)
        
        # Aggressively scroll to load dynamic elements
        page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)")
        time.sleep(2)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(2)
        
        # Click "See all reviews" to get to the dedicated review page
        see_all = page.locator('a[data-hook="see-all-reviews-link-foot"]')
        if see_all.is_visible():
            see_all.click()
            time.sleep(4)
        
        reviews = []
        # Scrape up to 5 pages of reviews
        for p in range(5):
            review_elements = page.locator('span[data-hook="review-body"]')
            count = review_elements.count()
            for i in range(count):
                text = review_elements.nth(i).inner_text().strip()
                if text and text not in reviews:
                    reviews.append(text)
            
            # Go to next page
            next_btn = page.locator('li.a-last a')
            if next_btn.is_visible():
                next_btn.click()
                time.sleep(3)
            else:
                break
                
        print(f"[+] Successfully scraped {len(reviews)} reviews from Amazon.")
        return reviews
        
    except Exception as e:
        print(f"[-] Amazon Scraper Error: {e}")
        return []

def scrape_flipkart_reviews(page, product_name):
    print(f"\n[*] Searching Flipkart for '{product_name}'...")
    search_url = f"https://www.flipkart.com/search?q={product_name.replace(' ', '%20')}"
    
    try:
        page.goto(search_url, timeout=60000)
        time.sleep(3)
        
        product_link = page.locator("a[href*='/p/'][href*='pid=']").first
        if not product_link.is_visible():
            print("[-] Could not find the product on Flipkart.")
            return []
            
        href = product_link.get_attribute('href')
        product_url = "https://www.flipkart.com" + href
        print(f"[*] Found Flipkart Product. Fetching reviews from: {product_url.split('?')[0]}")
        
        page.goto(product_url, timeout=60000)
        time.sleep(3)
        
        page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)")
        time.sleep(2)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(2)
        
        # Click "All reviews" link to get to dedicated review page
        all_reviews_link = page.locator("a[href*='/product-reviews/']").first
        if all_reviews_link.is_visible():
            all_reviews_link.click()
            time.sleep(4)
        
        reviews = []
        # Scrape up to 5 pages
        for p in range(5):
            # Expand 'READ MORE' buttons
            read_more_btns = page.locator("span:has-text('READ MORE')")
            try:
                count = read_more_btns.count()
                for i in range(count):
                    read_more_btns.nth(i).click(timeout=1000)
            except Exception:
                pass
                
            # Both t-ZTKy and Zmyqqu are commonly used by Flipkart for reviews
            review_elements = page.locator('div.t-ZTKy')
            if review_elements.count() == 0:
                review_elements = page.locator('div.Zmyqqu')
            
            # Fallback: Sometimes they use a generic long string class. 
            # We look for divs that have typical review length if the standard classes fail.
            count = review_elements.count()
            if count == 0:
                generic_divs = page.locator('div')
                for i in range(generic_divs.count()):
                    try:
                        text = generic_divs.nth(i).inner_text().strip()
                        if len(text) > 60 and "READ MORE" in text:
                            text = text.replace("READ MORE", "").strip()
                            if text not in reviews:
                                reviews.append(text)
                    except: pass
            else:
                for i in range(count):
                    text = review_elements.nth(i).inner_text().strip()
                    text = text.replace("READ MORE", "").strip()
                    if text and text not in reviews:
                        reviews.append(text)
                    
            # Next page
            next_btn = page.locator("a:has-text('NEXT')")
            if next_btn.is_visible():
                next_btn.click()
                time.sleep(3)
            else:
                break
                
        print(f"[+] Successfully scraped {len(reviews)} reviews from Flipkart.")
        return reviews
        
    except Exception as e:
        print(f"[-] Flipkart Scraper Error: {e}")
        return []

if __name__ == "__main__":
    print("==================================================")
    print(" 🛒 Headless Browser Review Scraper (Playwright)  ")
    print("==================================================")
    
    product = input("Enter the product name to scrape (e.g., 'Macbook Air M2'): ").strip()
    
    if not product:
        print("Product name cannot be empty.")
        exit()
        
    print("\n[!] Launching invisible Chromium browser... This acts like a real human.")
    with sync_playwright() as p:
        # Launch Chromium headless
        browser = p.chromium.launch(headless=True)
        # Use a realistic context to avoid bot detection
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        # Try scraping
        amazon_reviews = scrape_amazon_reviews(page, product)
        flipkart_reviews = scrape_flipkart_reviews(page, product)
        
        browser.close()
    
    all_reviews = {
        "product": product,
        "amazon_count": len(amazon_reviews),
        "flipkart_count": len(flipkart_reviews),
        "total_reviews": len(amazon_reviews) + len(flipkart_reviews),
        "reviews": amazon_reviews + flipkart_reviews
    }
    
    output_file = f"{product.replace(' ', '_').lower()}_reviews.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_reviews, f, indent=4, ensure_ascii=False)
        
    print(f"\n[🚀] Done! Saved all {all_reviews['total_reviews']} reviews to '{output_file}'.")
    print("You can now pass this JSON file into your local AI analyzer model!")
