import { tavily } from "@tavily/core";


import * as cheerio from "cheerio";


const client = tavily({
    apiKey: process.env.TAVILY_API_KEY!,
})


async function searchWeb(
    query: string,
    maxResults: number = 5
) {

    const response = await client.search(query, {
        maxResults,
        searchDepth: "advanced"
    });

    return response.results
    
}

// test 
async function main() {
//   const results = await searchWeb("latest developments in RAG", 5);


const results = await fetchPage("https://zilliz.com/blog/8-latest-rag-advancements-every-developer-should-know")

  console.log(results);
}

main();

async function fetchPage(url: string) : Promise<string>{

    const response = await fetch(url, {
        headers:{
            "User-Agent": "Mozilla/5.0",
        }
    });

    if(!response.ok){
        throw new Error(
      `Failed to fetch ${url}: ${response.status}`
    );
    }
    const html = await response.text();


    const $ = cheerio.load(html);
     
    $("script").remove();
    $("style").remove();
    $("iframe").remove();

  $("nav").remove();
  $("footer").remove();
  $("header").remove();
    
  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();

    return text;
}



export async function webSearchAndFetch(
  query: string,
  maxResults: number = 5
) {

  const searchResults = await searchWeb(
    query,
    maxResults
  );

  const results =[];

  for (const result of searchResults){

    try{
      const pageText = await fetchPage(
        result.url
      );
      
      results.push({
        title: result.title,
        url: result.url,
        content: pageText,
        score: result.score,
      });


    }catch(error){
         
        console.error(
        `Failed to fetch ${result.url}:`,
        error
      );

      // Don't let one bad website
      // break the entire search.
      results.push({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score,
      });
    }
  }

  return results

}