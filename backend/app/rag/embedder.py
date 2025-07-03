from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
import hashlib
import json
import os


def get_file_hash(file_contents: list[dict]) -> str:
    """Generate a hash of file contents to detect changes."""
    content_str = json.dumps(
        [{"path": f["path"], "content": f["content"]} for f in file_contents],
        sort_keys=True,
    )
    return hashlib.md5(content_str.encode()).hexdigest()


def embed_repo(file_contents: list[dict], persist_directory: str = "/data/chroma"):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")

    # Check if we already have embeddings for these exact files
    file_hash = get_file_hash(file_contents)
    hash_file_path = os.path.join(persist_directory, "file_hash.txt")

    # Create persist directory if it doesn't exist
    os.makedirs(persist_directory, exist_ok=True)

    # Check if we have cached embeddings
    if os.path.exists(hash_file_path):
        with open(hash_file_path, "r") as f:
            cached_hash = f.read().strip()
        if cached_hash == file_hash:
            # Files haven't changed, use existing embeddings
            vectorstore = Chroma(
                embedding_function=embedding_model, persist_directory=persist_directory
            )
            return f"Using cached embeddings for {len(file_contents)} files."

    # Files have changed or no cache exists, re-embed
    all_docs = []
    for file in file_contents:
        content = file["content"]
        path = file["path"]
        docs = splitter.create_documents([content], metadatas=[{"source": path}])
        all_docs.extend(docs)

    vectorstore = Chroma.from_documents(
        documents=all_docs,
        embedding=embedding_model,
        persist_directory=persist_directory,
    )

    # Save the file hash for future cache checks
    with open(hash_file_path, "w") as f:
        f.write(file_hash)

    return f"Embedded {len(all_docs)} chunks from {len(file_contents)} files."
