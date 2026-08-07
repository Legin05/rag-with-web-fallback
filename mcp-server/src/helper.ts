import { spawn } from "node:child_process"

function runPythonSearch(question: string): Promise<string> {

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

        resolve(output);
    });

    });
}

export default runPythonSearch