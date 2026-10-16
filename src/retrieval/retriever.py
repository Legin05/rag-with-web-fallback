from src.ingestion.embeddings import create_embeddings
from src.vector_store import text_search
from src.vector_store import vector_search

from langchain_core.documents import Document

def get_query_embedding(question: str):
    """
    Creates a normalized embedding for the user's question.
    """

    query_document = Document(
        page_content=question
    )

    _, embeddings = create_embeddings(
        [query_document],
        batch_size=1
    )

    return embeddings[0]


def retrieve_text(
    question: str,
    limit: int = 10
):
    return text_search(
        question,
        limit
    )





def reciprocal_rank_fusion(
    text_results: list,
    vector_results: list,
    top_k: int = 5,
    k: int = 60
):
    """
    Combines text-search and vector-search results
    using Reciprocal Rank Fusion (RRF).
    """

    scores = {}
    documents = {}
    text_scores = {}
    vector_scores = {}

    for rank, result in enumerate(
        text_results,
        start=1
    ):
        document_id = str(result["_id"])
        rrf_score = 1 / (k + rank)
        scores[document_id] = scores.get(document_id, 0) + rrf_score
        documents[document_id] = dict(result)
        text_scores[document_id] = result.get("score", 0.0)

    # -------------------------
    # Vector search results
    # -------------------------

    for rank, result in enumerate(
        vector_results,
        start=1
    ):
        document_id = str(result["_id"])
        rrf_score = 1 / (k + rank)
        scores[document_id] = scores.get(document_id, 0) + rrf_score
        if document_id not in documents:
            documents[document_id] = dict(result)
        vector_scores[document_id] = result.get("score", 0.0)

    # -------------------------
    # Sort by fusion score
    # -------------------------

    ranked_documents = sorted(
        documents.values(),
        key=lambda document:
            scores[str(document["_id"])],
        reverse=True
    )

    # Add fusion score and separate scores
    for document in ranked_documents:
        doc_id = str(document["_id"])
        document["fusion_score"] = scores[doc_id]
        document["vector_score"] = vector_scores.get(doc_id, 0.0)
        document["text_score"] = text_scores.get(doc_id, 0.0)

    return ranked_documents[:top_k]


def hybrid_search(
    question: str,
    top_k: int = 5,
    search_limit: int = 10
):
    """
    Performs hybrid search using both
    text search and vector search.
    """

    # -------------------------
    # 1. Text search
    # -------------------------

    text_results = text_search(
        question,
        limit=search_limit
    )

    # -------------------------
    # 2. Create query embedding
    # -------------------------

    query_vector = get_query_embedding(
        question
    )

    # -------------------------
    # 3. Vector search
    # -------------------------

    vector_results = vector_search(
        query_vector,
        limit=search_limit
    )

    # -------------------------
    # 4. Fuse results
    # -------------------------

    results = reciprocal_rank_fusion(
        text_results,
        vector_results,
        top_k=top_k
    )

    return results

# if __name__ == "__main__":
    
#     question = "What is Spring Boot?"

#     query_vector = get_query_embedding(question)

#     print(len(query_vector))
#     print(query_vector)

#     print("Vector dimensions:", len(query_vector))

#     # results = vector_search(
#     #     query_vector,
#     #     limit=5
#     # )
#     # results = text_search(
#     # "What is Spring Boot?",
#     # limit=5
#     # ) 
#     results = vector_search(
#         query_vector,
#         limit=5
#     )
#     results = vector_search(
#         query_vector,
#         limit=5
#     )

#     for result in results:

#         print("\n-------------------")

#         print("Score:", result["score"])

#         print(
#             "Text:",
#             result["text"][:300]
#         )







if __name__ == "__main__":

    question = "What is Spring Boot?"

    results = hybrid_search(
        question,
        top_k=5
    )

    # for rank, result in enumerate(
    #     results,
    #     start=1
    # ):

    #     print("\n------------------------")

    #     print("Rank:", rank)

    #     print(
    #         "Fusion Score:",
    #         result["fusion_score"]
    #     )

    #     print(
    #         "Text:",
    #         result["text"][:300]
    #     )