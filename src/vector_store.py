import os

from pymongo import MongoClient
from dotenv import load_dotenv

from langchain_core.documents import Document
from pymongo.command_cursor import CommandCursor


load_dotenv()



def get_mongodb_client():

    return MongoClient(
        os.getenv("MONGODB_URI")
    )


import os

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()


def get_mongodb_client():

    uri = os.getenv("MONGODB_URI")

    

    return MongoClient(uri)

def ping_mongodb():
    try:
        client = get_mongodb_client()

        # Send a ping command
        client.admin.command("ping")

        print("Successfully connected to MongoDB!")
        return True

    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return False

def get_collection():

    client = get_mongodb_client()

    database_name = os.getenv(
        "DATABASE_NAME"
    )

    collection_name = os.getenv(
        "COLLECTION_NAME"
    )

    db = client[database_name]

    collection = db[collection_name]

    # print(
    #     f"Database : {database_name}"
    # )

    # print(
    #     f"Collection : {collection_name}"
    # )

    # print(
    #     "Successfully created/accessed "
    #     "the collection."
    # )

    return collection





def store_embeddings(
    documents: list[Document],
    embeddings: list[list[float]],
):
    """
    Stores chunk text, metadata
    and embeddings in MongoDB.
    """

    collection = get_collection()

    records = []

    for document, embedding in zip(
        documents,
        embeddings,
    ):

        records.append(
            {
                "text":
                document.page_content,

                "embedding":
                embedding,

                "metadata":
                document.metadata,
            }
        )

    collection.insert_many(
        records
    )

    print(
        f"{len(records)} chunks inserted."
    )



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
        print(doc)
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