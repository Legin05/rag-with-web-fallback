import os

from pymongo import MongoClient
from dotenv import load_dotenv

from langchain_core.documents import Document


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

    print(uri)

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

def create_database_and_collection():

    client = get_mongodb_client()

    database_name = os.getenv(
        "DATABASE_NAME"
    )

    collection_name = os.getenv(
        "COLLECTION_NAME"
    )

    db = client[database_name]

    collection = db[collection_name]

    print(
        f"Database : {database_name}"
    )

    print(
        f"Collection : {collection_name}"
    )

    print(
        "Successfully created/accessed "
        "the collection."
    )

    return collection


def store_embeddings(
    documents: list[Document],
    embeddings: list[list[float]],
):
    """
    Stores chunk text, metadata
    and embeddings in MongoDB.
    """

    collection = create_database_and_collection()

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
