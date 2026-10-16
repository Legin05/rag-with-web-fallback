import { spawn } from "node:child_process"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const baseDir = path.resolve(__dirname, "../../")
const ragRootDir = fs.existsSync(path.join(baseDir, ".venv"))
  ? baseDir
  : (process.env.RAG_ROOT_DIR || process.cwd())

export type SearchResult ={
  _id: string;
  text: string;
  metadata: Record<string, unknown>;
  score?: number;
  fusion_score?:number;
}

function getPythonExecutable(): { cmd: string; prefixArgs: string[]; useShell: boolean } {
  const venvWin = path.join(ragRootDir, ".venv", "Scripts", "python.exe");
  const venvUnix = path.join(ragRootDir, ".venv", "bin", "python");
  if (fs.existsSync(venvWin)) return { cmd: venvWin, prefixArgs: [], useShell: false };
  if (fs.existsSync(venvUnix)) return { cmd: venvUnix, prefixArgs: [], useShell: false };
  return { cmd: "uv", prefixArgs: ["run", "python"], useShell: process.platform === "win32" };
}

function runPythonSearch(question: string): Promise<SearchResult[]> {

    return new Promise((resolve, reject)=>{
        const { cmd, prefixArgs, useShell } = getPythonExecutable();
        const python = spawn(
            cmd,
            [...prefixArgs, "-m", "src.retrieval.search", question],
            { cwd: ragRootDir, shell: useShell }
        );


        let output = "";
        let error = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("error", (err) => {
      reject(new Error(`Failed to spawn Python process (${cmd}): ${err.message}`));
    });

    python.on("close", (code) => {
        if(code !== 0){
            reject(
          new Error(error || `Python exited with code ${code}`)
        );
        return;
        }

        try {
          const jsonStart = output.indexOf("[");
          const jsonEnd = output.lastIndexOf("]");

          if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
            throw new Error(`No JSON array found in stdout output: ${output}`);
          }

          const jsonString = output.slice(jsonStart, jsonEnd + 1);
          const results: SearchResult[] = JSON.parse(jsonString);
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