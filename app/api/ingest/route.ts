import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ragRootDir = path.resolve(__dirname, "../../../");

function getPythonExecutable(): { cmd: string; prefixArgs: string[] } {
  const venvWin = path.join(ragRootDir, ".venv", "Scripts", "python.exe");
  const venvUnix = path.join(ragRootDir, ".venv", "bin", "python");
  if (fs.existsSync(venvWin)) return { cmd: venvWin, prefixArgs: [] };
  if (fs.existsSync(venvUnix)) return { cmd: venvUnix, prefixArgs: [] };
  return { cmd: "uv", prefixArgs: ["run", "python"] };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const fileExt = path.extname(fileName).toLowerCase();

    if (fileExt !== ".pdf" && fileExt !== ".txt" && fileExt !== ".md") {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Only PDF and TXT files are supported." },
        { status: 400 }
      );
    }

    // Save temporary file in rag/tmp/uploads
    const uploadsDir = path.join(ragRootDir, "tmp", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const tempFilePath = path.join(uploadsDir, `${Date.now()}_${fileName}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempFilePath, buffer);

    // Run Python ingestion script
    const pyOutput = await new Promise<string>((resolve, reject) => {
      const { cmd, prefixArgs } = getPythonExecutable();
      const pythonProcess = spawn(
        cmd,
        [...prefixArgs, "-m", "src.ingestion.ingest_file", tempFilePath],
        { cwd: ragRootDir }
      );

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        // Remove temporary file
        unlink(tempFilePath).catch(() => {});

        if (code !== 0) {
          reject(new Error(stderr || `Ingestion process exited with code ${code}`));
          return;
        }
        resolve(stdout.trim());
      });
    });

    try {
      const result = JSON.parse(pyOutput);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Ingestion failed" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        fileName,
        chunksInserted: result.chunks_inserted,
        message: `Successfully ingested ${fileName} (${result.chunks_inserted} vector chunks created)`,
      });
    } catch (e) {
      return NextResponse.json({
        success: true,
        fileName,
        message: `File uploaded and processed: ${pyOutput}`,
      });
    }
  } catch (error: any) {
    console.error("Ingestion API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process ingestion request" },
      { status: 500 }
    );
  }
}
