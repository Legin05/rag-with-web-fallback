

import sys
from pathlib import Path

from src.ingestion.loader import load_pdf
from src.ingestion.chunker import chunk_documents
from src.ingestion.embeddings import create_embeddings
from src.vector_store import store_embeddings

def main():
    if len(sys.argv) > 1:
        pdf_path = Path(sys.argv[1])
    else:
        pdf_path = Path("src/data/spring_boot_tutorial.pdf")

    if not pdf_path.exists():
        print(f"Error: File not found at '{pdf_path}'")
        return

    documents = load_pdf(pdf_path)

    chunks = chunk_documents(
    documents,
    chunk_size=500,
    chunk_overlap=100,
    )

    print(f"Total Chunks : {len(chunks)}")

    print("-" * 50)
    print(chunks[0].page_content)

    print("-" * 50)
    print(chunks[0].metadata)



    documents, embeddings = create_embeddings(
    chunks
    )

    # print(f"Total Chunks : {len(documents)}")

    # print(f"Total Embeddings : {len(embeddings)}")

    # print(
    # f"Embedding Dimension : {len(embeddings[0])}"
    # )

    # print()

    # print(embeddings[0][:10])

    store_embeddings(
        chunks,
        embeddings,
    )


if __name__ == "__main__":
    main()
