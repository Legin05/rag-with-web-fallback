import { count } from "node:console";
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

    const buttons = page.locator("button");

const count = await buttons.count();

for (let i = 0; i < count; i++) {
  console.log(
    await buttons.nth(i).innerText()
  );
}

    // Check links
    const links = await page.locator("a").count();

    console.log("Number of links:", links);

    // Check input fields
    const inputs = await page.locator("input").count();

    console.log("Number of inputs:", inputs);

  } finally {
    await browser.close();
  }
}

main();