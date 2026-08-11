import { chromium } from "playwright";
import * as cheerio from "cheerio";

export default async function fetchPageFromChromium(url: string): Promise<string>{

    const browser = await chromium.launch({
        headless: true
    });




    try{
          
        const page = await browser.newPage();


        await page.goto(url , {
            waitUntil:"domcontentloaded",
            timeout: 30000
        });

        const html = await page.content();

        const $ = cheerio.load(html);

    // Remove elements that don't contain useful content
    $("script").remove();
    $("style").remove();
    $("nav").remove();
    $("footer").remove();
    $("header").remove();
    $("noscript").remove();

    const text = $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    return text;

    }catch(e){

    }finally{
        await browser.close();
    }
     return "";

}

