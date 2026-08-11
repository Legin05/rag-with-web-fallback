import { chromium } from "playwright";
async function main() {
    const browser = await chromium.launch({
        headless: true,
    });
    try {
        const page = await browser.newPage();
        await page.goto("https://spring.io/projects/spring-boot", {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });
        // Check if a button exists
        const buttons = await page.locator("button").count();
        console.log("Number of buttons:", buttons);
        if (buttons > 0) {
            console.log("Button exists");
        }
        else {
            console.log("No buttons found");
        }
        // Check links
        const links = await page.locator("a").count();
        console.log("Number of links:", links);
        // Check input fields
        const inputs = await page.locator("input").count();
        console.log("Number of inputs:", inputs);
    }
    finally {
        await browser.close();
    }
}
main();
