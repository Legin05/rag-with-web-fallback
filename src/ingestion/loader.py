

from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader


def load_pdf(file_path: str):

    loader = PyPDFLoader(file_path)

    documents = loader.load()

    return documents


if __name__ == "__main__":
     pdf_path = Path("src/data/spring_boot_tutorial.pdf")

     documents = load_pdf(pdf_path)

     
     

     print(f"Total Pages : {len(documents)}")
     print("-" * 50)

     print("First Page Content:\n")

     print(documents[2].page_content)
     print("-" * 50)

     print("Metadata :\n")

     print(documents[2].metadata)