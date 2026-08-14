import sys
import os
import json

os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from src.retrieval.retriever import hybrid_search


def main():
    question = sys.argv[1]

    results = hybrid_search(
        question=question,
        search_limit=5
    )

    print(json.dumps(results, default=str))


if __name__ == "__main__":
    main()