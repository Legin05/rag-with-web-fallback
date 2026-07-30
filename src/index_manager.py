

from vector_store import (
    create_database_and_collection,
    ping_mongodb
    
)


def create_text_index():
    """
    Creates the text search index.
    """

    collection = create_database_and_collection()

    collection.create_index(
        [
            ("text", "text"),
        ],
        name="spring_chunks_text_index",
    )

    print(
        "Text index created successfully."
    )


def create_vector_index():
    """
    Vector Search Indexes are
    created from MongoDB Atlas.

    Create the following index
    from the Atlas Dashboard.
    """

    print()

    print(
        """
{
    "fields":[
        {
            "type":"vector",
            "path":"embedding",
            "numDimensions":384,
            "similarity":"cosine"
        }
    ]
}
        """
    )


if __name__ == "__main__":

    if ping_mongodb():

        create_text_index()
        create_vector_index()

       