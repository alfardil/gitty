from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma


def embed_repo(file_contents: list[dict], persist_directory: str = "./backend/rag/db"):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")

    all_docs = []

    for file in file_contents:
        content = file["content"]
        path = file["path"]
        docs = splitter.create_documents([content], metadatas=[{"source": path}])
        all_docs.extend(docs)

    vectorstore = Chroma.from_documents(
        documents=all_docs,
        embedding=embedding_model,
        persist_directory=None,
    )

    return f"Embedded {len(all_docs)} chunks."
