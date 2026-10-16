

import os
import json
from src.vector_store import get_collection, ping_mongodb


def create_text_index():
    """
    Creates the text search index.
    In MongoDB Atlas, Atlas Search uses Lucene indexes.
    We attempt to create it via create_search_index if supported,
    or display the exact JSON definition for the Atlas UI.
    """
    collection = get_collection()
    text_index_name = os.getenv("TEXT_INDEX_NAME", "spring_chunks_text_index")

    definition = {
        "mappings": {
            "dynamic": False,
            "fields": {
                "text": {
                    "type": "string",
                    "analyzer": "lucene.standard"
                }
            }
        }
    }

    try:
        from pymongo.operations import SearchIndexModel
        model = SearchIndexModel(
            definition=definition,
            name=text_index_name,
            type="search"
        )
        collection.create_search_index(model=model)
        print(f"Atlas Search text index '{text_index_name}' creation requested via API.")
    except Exception as e:
        print(f"Could not automatically create Atlas Search index via driver API: {e}")
        print(f"\nTo create '{text_index_name}' in MongoDB Atlas Dashboard -> Atlas Search:")
        print(json.dumps(definition, indent=2))


def create_vector_index():
    """
    Creates or displays the Vector Search Index definition for MongoDB Atlas.
    """
    collection = get_collection()
    vector_index_name = os.getenv("VECTOR_INDEX_NAME", "spring_chunks_vector_index")

    definition = {
        "fields": [
            {
                "type": "vector",
                "path": "embedding",
                "numDimensions": 384,
                "similarity": "cosine"
            }
        ]
    }

    try:
        from pymongo.operations import SearchIndexModel
        model = SearchIndexModel(
            definition=definition,
            name=vector_index_name,
            type="vectorSearch"
        )
        collection.create_search_index(model=model)
        print(f"Atlas Vector Search index '{vector_index_name}' creation requested via API.")
    except Exception as e:
        print(f"Could not automatically create Atlas Vector Search index via driver API: {e}")
        print(f"\nTo create '{vector_index_name}' in MongoDB Atlas Dashboard -> Atlas Vector Search:")
        print(json.dumps(definition, indent=2))


if __name__ == "__main__":
    if ping_mongodb():
        print("\n--- 1. Text Search Index ---")
        create_text_index()
        print("\n--- 2. Vector Search Index ---")
        create_vector_index()

       