from copy import deepcopy

from transformers import AutoTokenizer

from langchain_core.documents import Document

# We'll use the same tokenizer as our embedding model.
# tokenizer = AutoTokenizer.from_pretrained(
#     "sentence-transformers/all-MiniLM-L6-v2"
# )

def get_tokenizer():

    return AutoTokenizer.from_pretrained(
        "sentence-transformers/all-MiniLM-L6-v2"
    )


def chunk_documents(
        documents: list[Document],
        chunk_size = 500,
        chunk_overlap=100
):
    """
    Splits documents into token-based chunks while preserving metadata.
    """

    # Validations
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than 0.")

    if chunk_overlap < 0:
        raise ValueError("chunk_overlap cannot be negative.")

    if chunk_overlap >= chunk_size:
        raise ValueError(
            "chunk_overlap must be smaller than chunk_size."
        )
    
    tokenizer = get_tokenizer()
    
    chunks = []

    # Globally unique chunk ids.
    chunk_id = 1

    for document in documents:

        text = document.page_content
        # Convert text into token ids.

        token_ids = tokenizer.encode(
            text,
            add_special_tokens = False,
        )

        total_tokens = len(token_ids)

        start =0

        while start < total_tokens :
             # Prevent going beyond the document.
             end = min(
                start + chunk_size,
                total_tokens,
             )

             chunk_token_ids = token_ids[start : end]

             # Convert token ids back to text.
             chunk_text = tokenizer.decode(
                chunk_token_ids,
                skip_special_tokens=True,
             ).strip()

             if chunk_text:

                metadata = deepcopy(document.metadata) 

                metadata["chunk_id"] = chunk_id
                metadata["chunk_size"] = chunk_size
                metadata["token_count"] = len(chunk_token_ids)
                metadata["chunk_start"] = start
                metadata["chunk_end"] = end 

                chunks.append(
                    Document(
                        page_content=chunk_text,
                        metadata=metadata,
                    )
                )

                chunk_id+=1   


            # If we've processed the final chunk,
            # stop chunking this document.
             if end == total_tokens:
                break  

             # Preserve overlap.
             start = end - chunk_overlap 
    

    return chunks

    