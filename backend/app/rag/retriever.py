"""
This module defines a function to retrieve the most relevant document chunks
from a Chroma vector database using semantic similarity with OpenAI embeddings.
"""

from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma


def get_relevant_chunks(
    query: str, k: int = 4, persist_directory: str = "./backend/rag/db"
):
    """
    Retrieve the top-k most relevant document chunks from the Chroma vectorstore.

    Args:
        query (str): The search query to find similar documents for.
        k (int, optional): The number of top matching chunks to return. Defaults to 4.
        persist_directory (str, optional): Path to the persisted Chroma DB. Defaults to "./backend/rag/db".

    Returns:
        List[Document]: A list of documents with `.page_content` and `.metadata` fields,
                        representing the most semantically similar chunks.
    """
    embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")
    vectorstore = Chroma(embedding_function=embedding_model, persist_directory=None)

    results = vectorstore.similarity_search(query, k=k)
    return results  # List[Document] with .page_content and .metadata
