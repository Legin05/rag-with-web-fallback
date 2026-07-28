from transformers import AutoTokenizer, AutoModel
from langchain_core.documents import Document


import torch
import torch.nn.functional as F
def get_tokenizer():
    """
    Loads and returns the tokenizer.
    """

    return AutoTokenizer.from_pretrained(
        "sentence-transformers/all-MiniLM-L6-v2"
    )



def get_embedding_model():
    """
    Loads and returns our embedding model.
    """

    return AutoModel.from_pretrained(
        "sentence-transformers/all-MiniLM-L6-v2"
    )


def mean_pooling(model_output, attention_mask):
    """
    Performs mean pooling on the token embeddings.
    """

    token_embeddings = model_output.last_hidden_state


    """Take the attention mask (batch_size, sequence_length).
    Add one more dimension (batch_size, sequence_length, 1).
    Expand it to match the shape of the token embeddings (batch_size, sequence_length, embedding_size).
    Convert it to floating-point values.
    Use it to zero out the embeddings of padding tokens before computing the mean pooled sentence embedding.
    """
    input_mask_expanded =(
        attention_mask
        .unsqueeze(-1)
        .expand(token_embeddings.size())
        .float()
    )


    return  torch.sum(
        token_embeddings * input_mask_expanded,
        dim=1
    )/ torch.clamp(
        input_mask_expanded.sum(dim=1),
        min=1e-9
    )


def create_embeddings(
        documents: list[Document],
        batch_size : int =32
    ):
    """
    Creates normalized embeddings for the
    supplied documents.
    """
    if not documents:
        return documents, []

    tokenizer = get_tokenizer()
    model = get_embedding_model()

    texts = [
        document.page_content
        for document in documents
    ]

    embeddings = []

    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]

        encoded_input = tokenizer(
            batch_texts,
            padding = True,
            truncation = True,
             return_tensors="pt",
        )


        with torch.no_grad():

            model_output = model(
                **encoded_input
            )


        # Mean Pooling
        batch_embeddings = mean_pooling(
            model_output,
            encoded_input["attention_mask"]
        )
        #Take one sentence embedding at a time.
     # Compute its Euclidean length (L2 norm).
# Divide all 384 values by that length.
# After normalization, every embedding has length exactly 1.
        #normalize
        batch_embeddings = F.normalize(
             batch_embeddings,
             p=2,
             dim=1,
        )
        embeddings.extend(
            batch_embeddings.tolist()
        )

    return documents, embeddings
            

    