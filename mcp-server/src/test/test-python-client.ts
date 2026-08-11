import runPythonSearch from "../python-client.js";

async function main() {
  try {
    const results = await runPythonSearch(
      "What is Spring Boot?"
    );

    console.log("Type:", typeof results);
    console.log("Is array:", Array.isArray(results));
    console.log("Number of results:", results.length);

    console.log("\nFirst result:");
    console.log(results[0]);

  } catch (error) {
    console.error("Python search failed:");
    console.error(error);
  }
}

main();