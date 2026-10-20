import asyncio
from playwright.async_api import async_playwright

async def run_e2e():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        
        print("Navigating to desktop app at http://localhost:5173/#linkedin ...")
        await page.goto("http://localhost:5173/#linkedin")
        await page.wait_for_load_state("networkidle")
        
        # Verify page title
        header_text = await page.locator(".page-header h2").inner_text()
        print(f"Header: {header_text}")
        assert "LinkedIn Intelligence Hub" in header_text, f"Expected 'LinkedIn Intelligence Hub', got {header_text}"
        
        # Verify search inputs exist
        keywords_val = await page.locator("#liKeywords").input_value()
        print(f"Keywords input value: {keywords_val}")
        assert len(keywords_val) > 0, "Expected default keywords"
        
        # Verify tabs exist and switch to Status tab
        print("Switching to Session & Health tab...")
        await page.locator('.tab-btn[data-tab="status"]').click()
        await page.wait_for_timeout(500)
        
        status_text = await page.locator(".status-tab-card").inner_text()
        print("Status Card contents:")
        print(status_text)
        assert "LinkedIn MCP Session Diagnostics" in status_text
        
        # Switch to Saved Jobs tab
        print("Switching to Saved Jobs tab...")
        await page.locator('.tab-btn[data-tab="saved"]').click()
        await page.wait_for_timeout(500)
        assert await page.locator("#btnFetchSaved").is_visible()
        
        # Switch back to Search tab
        await page.locator('.tab-btn[data-tab="search"]').click()
        await page.wait_for_timeout(500)
        assert await page.locator("#btnSearchLinkedIn").is_visible()
        
        # Capture screenshot
        screenshot_path = r"C:\Users\Raj\.gemini\antigravity-ide\brain\7c80008c-4f09-4041-a603-c5c847079f74\scratch\linkedin_hub_e2e.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to: {screenshot_path}")
        
        await browser.close()
        print("ALL E2E CHECKS PASSED SUCCESSFULLY ✅")

if __name__ == "__main__":
    asyncio.run(run_e2e())
