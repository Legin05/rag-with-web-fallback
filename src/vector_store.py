import os
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from pymongo.command_cursor import CommandCursor
from langchain_core.documents import Document

load_dotenv()

def get_mongodb_client():
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise ValueError("MONGODB_URI is not set in environment variables.")
    return MongoClient(uri)

def ping_mongodb():
    try:
        client = get_mongodb_client()
        client.admin.command("ping")
        print("Successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return False

def get_collection():
    client = get_mongodb_client()
    database_name = os.getenv("DATABASE_NAME", "rag_database")
    collection_name = os.getenv("COLLECTION_NAME", "documents")
    return client[database_name][collection_name]

def store_embeddings(
    documents: list[Document],
    embeddings: list[list[float]],
    upsert: bool = True,
):
    """
    Stores chunk text, metadata and embeddings in MongoDB.
    Uses upsert if chunk_id is available to avoid duplicates.
    """
    collection = get_collection()

    operations = []
    for document, embedding in zip(documents, embeddings):
        record = {
            "text": document.page_content,
            "embedding": embedding,
            "metadata": document.metadata,
        }
        chunk_id = document.metadata.get("chunk_id")
        source = document.metadata.get("source")

        if upsert and chunk_id is not None:
            filter_query = {"metadata.chunk_id": chunk_id}
            if source:
                filter_query["metadata.source"] = source
            operations.append(UpdateOne(filter_query, {"$set": record}, upsert=True))
        else:
            operations.append(record)

    if not operations:
        print("No chunks to store.")
        return

    if upsert and isinstance(operations[0], UpdateOne):
        result = collection.bulk_write(operations)
        print(
            f"Stored {len(operations)} chunks (upserted: {result.upserted_count}, modified: {result.modified_count}, matched: {result.matched_count})."
        )
    else:
        collection.insert_many(operations)
        print(f"{len(operations)} chunks inserted.")



"""
Performs keyword-based text search using
MongoDB Atlas Search.
"""
def text_search(
    question: str,
    limit: int=10       
):
    collection=get_collection()

    pipeline =[
        {
            "$search":{
                "index": "spring_chunks_text_index",
                "text":{
                    "query": question,
                    "path":"text"
                }
            }
        },
        {
            "$limit": limit
        },
        {
            "$project":{
                "_id": 1,
            "text": 1,
            "metadata": 1,
            "score": {
                "$meta": "searchScore"
            }
            }
        }
    ]

    cursor: CommandCursor = collection.aggregate(pipeline)
    results=[]
    for doc in cursor:
        
        results.append(doc)


    return results  




def vector_search(
    query_vector: list[float],
    limit: int = 10,
    num_candidates: int = 100
):
    """
    Performs vector similarity search using
    MongoDB Atlas Vector Search.
    """

    collection = get_collection()

    pipeline = [
        {
            "$vectorSearch": {
                "index": "spring_chunks_vector_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": num_candidates,
                "limit": limit
            }
        },
        {
            "$project": {
                "_id": 1,
                "text": 1,
                "metadata": 1,
                "score": {
                    "$meta": "vectorSearchScore"
                }
            }
        }
    ]

    return list(
        collection.aggregate(pipeline)
    )