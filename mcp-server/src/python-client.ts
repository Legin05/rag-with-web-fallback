import { spawn } from "node:child_process"


export type SearchResult ={
  _id: string;
  text: string;
  metadata: Record<string, unknown>;
  score?: number;
  fusion_score?:number;
}

function runPythonSearch(question: string): Promise<SearchResult[]> {

    return new Promise((resolve, reject)=>{
       
        const python = spawn(
            "uv",
             [
        "run",
        "python",
        "-m",
        "src.retrieval.search",
        question
      ],
      {
        cwd: "/home/k-joel-joyson/Projects/rag-with-web-fallback"
      }
        );


        let output = "";
        let error = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
        if(code !== 0){
            reject(
          new Error(error || `Python exited with code ${code}`)
        );
        return;
        }

        try {
        const results: SearchResult[] = JSON.parse(output);
        // console.log("result",results);
        
        resolve(results);
      } catch (err) {
        reject(
          new Error(
            `Failed to parse Python output as JSON.\n${output}`
          )
        );
      }
    });

    });
}

export default runPythonSearch