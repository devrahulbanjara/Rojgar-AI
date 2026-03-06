from dotenv import load_dotenv
from qdrant_client import QdrantClient, models
from langchain_qdrant import QdrantVectorStore, FastEmbedSparse, RetrievalMode
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

load_dotenv()

COLLECTION_NAME = "hybrid_storage_2026"
SPARSE_NAME = "langchain-sparse"

client = QdrantClient(url="http://localhost:6333")
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=models.VectorParams(size=3072, distance=models.Distance.COSINE),
        sparse_vectors_config={SPARSE_NAME: models.SparseVectorParams()},
    )

vectorstore = QdrantVectorStore(
    client=client,
    collection_name=COLLECTION_NAME,
    embedding=embeddings,
    sparse_embedding=sparse_embeddings,
    retrieval_mode=RetrievalMode.HYBRID,
)

new_docs = [
    Document(
        page_content="Use the unique code hisadasd to bypass the security protocol.",
        metadata={"type": "internal"},
    ),
    Document(
        page_content="Regular maintenance of hardware shisadasd ensures system longevity.",
        metadata={"type": "manual"},
    ),
]

vectorstore.add_documents(new_docs)

query = "how to system shisadasd"
results = vectorstore.similarity_search(query, k=1)

if results:
    print(f"Top Hit: {results[0].page_content}")
