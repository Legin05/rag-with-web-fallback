import os
import json
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are SmartRAG, an enterprise AI assistant with hybrid knowledge retrieval and live web grounding.
Your task is to answer the user's question accurately, concisely, and factually using ONLY the provided context below.

Rules:
1. Base your answer strictly on the facts present in the Context. Do not invent or assume facts.
2. If the context does not contain sufficient information to answer the question, state:
   "I could not find sufficient information in the provided context to answer your question."
3. Include inline source citations (e.g. [Doc: <source>, Chunk: <id>] or [Source: <url>]) whenever stating a factual claim.
4. Conclude with a clear "Sources & Citations" section listing the referenced materials.
"""

def format_context_for_prompt(results: list, source_type: str = "rag") -> str:
    """
    Formats retrieved documents or web search results into a clean context block.
    """
    if not results:
        return "No relevant context found."

    formatted_entries = []
    for idx, item in enumerate(results, start=1):
        if source_type == "rag":
            chunk_text = item.get("text", "").strip()
            metadata = item.get("metadata", {})
            source_file = metadata.get("source", "Document")
            chunk_id = metadata.get("chunk_id", idx)
            score = item.get("fusion_score") or item.get("score", 0.0)

            header = f"[Source {idx} - {source_file} (Chunk {chunk_id}) | Score: {score:.4f}]"
            formatted_entries.append(f"{header}\n{chunk_text}")
        else:
            title = item.get("title", "Web Result")
            url = item.get("url", "unknown")
            content = item.get("content", "").strip()
            truncated_content = content[:1500] if len(content) > 1500 else content

            header = f"[Web Source {idx} - {title} | URL: {url}]"
            formatted_entries.append(f"{header}\n{truncated_content}")

    return "\n\n" + ("=" * 40) + "\n\n".join(formatted_entries) + "\n\n" + ("=" * 40)

def build_prompt_messages(question: str, context: str) -> list[dict]:
    """
    Creates standard chat messages array for LLM completion.
    """
    user_content = f"--- CONTEXT ---\n{context}\n\n--- QUESTION ---\n{question}\n\nAnswer:"
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content}
    ]

def generate_rag_response(
    question: str,
    retrieval_results: list,
    source_type: str = "rag",
    model_name: str = "gemini-1.5-flash"
) -> dict:
    """
    Synthesizes a grounded answer using Google Gemini or configured LLM.
    """
    context = format_context_for_prompt(retrieval_results, source_type=source_type)
    messages = build_prompt_messages(question, context)

    gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_GENERATIVE_AI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_api_key and "your_" in gemini_api_key:
        gemini_api_key = None

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key and "your_" in openai_api_key:
        openai_api_key = None

    answer = ""

    # 1. Attempt Google Gemini
    if gemini_api_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import SystemMessage, HumanMessage

            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=gemini_api_key,
                temperature=0.2
            )
            response = llm.invoke([
                SystemMessage(content=messages[0]["content"]),
                HumanMessage(content=messages[1]["content"])
            ])
            answer = response.content
        except ImportError:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=messages[0]["content"]
                )
                response = model.generate_content(messages[1]["content"])
                answer = response.text
            except Exception as e:
                answer = f"[Error invoking Gemini: {e}]"
        except Exception as e:
            answer = f"[Error invoking Gemini: {e}]"

    # 2. Fallback to OpenAI if configured
    elif openai_api_key:
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(model="gpt-4o-mini", api_key=openai_api_key, temperature=0.2)
            response = llm.invoke(messages[1]["content"])
            answer = response.content
        except Exception as e:
            answer = f"[Error invoking OpenAI: {e}]"

    # 3. Informative notice when API key is not yet set
    else:
        answer = (
            "[SmartRAG LLM Notice]: Context retrieved successfully, but no LLM API key (GEMINI_API_KEY or OPENAI_API_KEY) "
            "was configured in .env. Please provide GEMINI_API_KEY to enable full response generation.\n\n"
            f"Retrieved Grounding Context:\n{context[:600]}..."
        )

    return {
        "question": question,
        "answer": answer,
        "source": source_type,
        "context_count": len(retrieval_results),
        "citations": [
            r.get("url") if source_type == "web" else f"{r.get('metadata', {}).get('source', 'Doc')} (Chunk {r.get('metadata', {}).get('chunk_id')})"
            for r in retrieval_results
        ]
    }

if __name__ == "__main__":
    import sys
    test_question = sys.argv[1] if len(sys.argv) > 1 else "What is Spring Boot?"
    mock_results = [
        {
            "text": "Spring Boot makes it easy to create stand-alone, production-grade Spring based Applications that you can 'just run'.",
            "metadata": {"source": "spring_boot_tutorial.pdf", "chunk_id": 1},
            "fusion_score": 0.032
        }
    ]

    result = generate_rag_response(test_question, mock_results, source_type="rag")
    print(json.dumps(result, indent=2))
