import sys
import json
from pathlib import Path
from langchain_core.documents import Document

from src.ingestion.loader import load_pdf
from src.ingestion.chunker import chunk_documents
from src.ingestion.embeddings import create_embeddings
from src.vector_store import store_embeddings

def ingest_file(file_path_str: str):
    file_path = Path(file_path_str)
    
    if not file_path.exists():
        return {"success": False, "error": f"File not found: {file_path_str}"}

    ext = file_path.suffix.lower()

    if ext == ".pdf":
        documents = load_pdf(str(file_path))
    else:
        # Text/Markdown loader fallback
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        documents = [
            Document(
                page_content=content,
                metadata={"source": file_path.name, "file_name": file_path.name}
            )
        ]

    if not documents:
        return {"success": False, "error": "No content extracted from file"}

    # Step 2: Chunk documents
    chunks = chunk_documents(
        documents,
        chunk_size=500,
        chunk_overlap=100,
    )

    if not chunks:
        return {"success": False, "error": "No chunks generated from document"}

    # Step 3: Create embeddings
    chunks, embeddings = create_embeddings(chunks)

    # Step 4: Store in MongoDB Vector Store
    store_embeddings(chunks, embeddings)

    return {
        "success": True,
        "chunks_inserted": len(chunks),
        "file_name": file_path.name,
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing file path argument"}))
        sys.exit(1)

    file_path = sys.argv[1]
    try:
        result = ingest_file(file_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
