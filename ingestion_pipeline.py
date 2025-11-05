"""
RAG Ingestion Pipeline
======================
Complete ingestion pipeline for processing PDF files into vector embeddings
and indexing them in a vector database.

This script implements the Ingestion phase of a Retrieval-Augmented Generation (RAG) pipeline,
including PDF loading, text extraction, chunking, embedding generation, and indexing.

Future Integration Points:
- Google Cloud Storage (GCS) for document storage
- Vertex AI Vector Search for production-scale vector indexing
"""

import os
import sys
import tempfile
from typing import List, Optional
from pathlib import Path

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_vertexai import VertexAIEmbeddings

# ChromaDB imports
import chromadb
from chromadb.config import Settings

# Google Cloud imports
from google.cloud import aiplatform
from google.cloud import storage
from google.auth import default as google_auth_default


def setup_google_cloud_authentication():
    """
    Set up Google Cloud authentication for Vertex AI services.
    
    This function initializes the Vertex AI client and sets up authentication.
    Ensure that your Google Cloud credentials are configured via one of:
    - Environment variable: GOOGLE_APPLICATION_CREDENTIALS pointing to a service account key file
    - Application Default Credentials (ADC) if running on GCP
    - gcloud auth application-default login for local development
    """
    try:
        # Get default credentials
        credentials, project_id = google_auth_default()
        
        # Initialize Vertex AI
        if project_id:
            aiplatform.init(project=project_id, location="us-central1")
            print(f"✅ Google Cloud authentication successful (Project: {project_id})")
        else:
            # Try to get project from environment variable
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT_ID")
            if project_id:
                aiplatform.init(project=project_id, location="us-central1")
                print(f"✅ Google Cloud authentication successful (Project: {project_id})")
            else:
                print("⚠️  Warning: Could not determine GCP project ID. Some features may not work.")
                
    except Exception as e:
        print(f"⚠️  Warning: Google Cloud authentication issue: {e}")
        print("   Ensure GOOGLE_APPLICATION_CREDENTIALS is set or ADC is configured.")


def list_pdfs_in_bucket(gcs_bucket_name: str = "minewise-bucket") -> List[str]:
    """
    List all PDF files in the GCS bucket.
    
    Args:
        gcs_bucket_name (str): GCS bucket name
        
    Returns:
        List[str]: List of blob names (paths) for PDF files in the bucket
    """
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(gcs_bucket_name)
        
        pdf_files = []
        for blob in bucket.list_blobs():
            if blob.name.lower().endswith('.pdf'):
                pdf_files.append(blob.name)
        
        return sorted(pdf_files)
    except Exception as e:
        print(f"❌ Error listing PDFs in bucket: {e}")
        raise


def download_pdf_from_gcs(gcs_bucket_name: str, blob_name: str, local_path: Optional[str] = None) -> str:
    """
    Download a PDF file from GCS bucket to a local temporary file.
    
    Args:
        gcs_bucket_name (str): GCS bucket name
        blob_name (str): Name/path of the blob in the bucket
        local_path (str, optional): Local path to save the file. If None, creates a temp file.
        
    Returns:
        str: Path to the downloaded local file
    """
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(gcs_bucket_name)
        blob = bucket.blob(blob_name)
        
        if local_path is None:
            # Create a temporary file
            temp_dir = tempfile.gettempdir()
            filename = os.path.basename(blob_name)
            local_path = os.path.join(temp_dir, f"gcs_download_{filename}")
        
        # Download the file
        blob.download_to_filename(local_path)
        return local_path
    except Exception as e:
        print(f"❌ Error downloading PDF from GCS: {e}")
        raise


def ingest_pdf_to_vectorstore(pdf_path: str, vector_store_dir: str, gcs_bucket_name: str = "minewise-bucket", gcs_blob_name: Optional[str] = None):
    """
    Main ingestion function that processes a PDF file and indexes it in a vector store.
    
    Pipeline steps:
    1. Load PDF file (from local path or GCS)
    2. Extract text content
    3. Split text into chunks
    4. Generate embeddings for each chunk
    5. Store chunks and embeddings in ChromaDB
    
    Args:
        pdf_path (str): Path to the local PDF file to process
        vector_store_dir (str): Directory path where ChromaDB will store its data
        gcs_bucket_name (str): GCS bucket name (default: minewise-bucket)
        gcs_blob_name (str, optional): GCS blob name if processing from bucket
    
    Returns:
        int: Number of chunks processed and indexed
    """
    print("\n" + "="*70)
    print("🚀 Starting RAG Ingestion Pipeline")
    print("="*70 + "\n")
    
    # Determine GCS URI
    if gcs_blob_name:
        gcs_uri = f"gs://{gcs_bucket_name}/{gcs_blob_name}"
        document_source = gcs_uri
        print(f"📄 Processing document from GCS: {gcs_uri}")
    else:
        # Validate PDF file exists if it's a local file
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        gcs_uri = None
        document_source = pdf_path
    
    print(f"2. Loading PDF file: {pdf_path}")
    # Step 2: Load PDF using LangChain's PyPDFLoader
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    
    if not documents:
        raise ValueError("No content extracted from PDF. File may be empty or corrupted.")
    
    print(f"   ✅ Loaded {len(documents)} page(s) from PDF")
    
    # Step 3: Extract text content (already extracted by loader, but we can verify)
    total_text_length = sum(len(doc.page_content) for doc in documents)
    print(f"3. Extracted text content ({total_text_length:,} total characters)")
    
    # Step 4: Chunk the text using RecursiveCharacterTextSplitter
    print("4. Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = text_splitter.split_documents(documents)
    print(f"   ✅ Created {len(chunks)} chunk(s) (chunk_size=1000, chunk_overlap=200)")
    
    # Step 5: Generate embeddings using Vertex AI
    print("5. Generating embeddings using Vertex AI (text-embedding-004)...")
    
    # Initialize Vertex AI Embeddings
    # Note: This uses the text-embedding-004 model as specified
    embeddings_model = VertexAIEmbeddings(
        model_name="text-embedding-004",
        project=os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT_ID"),
        location="us-central1"
    )
    
    # Generate embeddings for all chunks
    chunk_texts = [chunk.page_content for chunk in chunks]
    print(f"   Generating embeddings for {len(chunk_texts)} chunks...")
    
    try:
        embeddings = embeddings_model.embed_documents(chunk_texts)
        print(f"   ✅ Generated {len(embeddings)} embedding(s) (dimension: {len(embeddings[0])})")
    except Exception as e:
        print(f"   ❌ Error generating embeddings: {e}")
        raise
    
    # Step 6: Index/Upsert into ChromaDB
    print(f"6. Indexing chunks into ChromaDB at '{vector_store_dir}'...")
    
    # Initialize ChromaDB client (persistent local storage)
    chroma_client = chromadb.PersistentClient(
        path=vector_store_dir,
        settings=Settings(anonymized_telemetry=False)
    )
    
    # Get or create collection
    collection_name = "pdf_documents"
    collection = chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"description": "PDF document chunks with embeddings"}
    )
    
    # Prepare documents for insertion
    # Include metadata: source file, page number
    ids = []
    metadatas = []
    contents = []
    
    # Get document name for IDs and metadata
    if gcs_blob_name:
        doc_name = Path(gcs_blob_name).stem
        doc_filename = os.path.basename(gcs_blob_name)
    else:
        doc_name = Path(pdf_path).stem
        doc_filename = os.path.basename(pdf_path)
    
    for i, chunk in enumerate(chunks):
        chunk_id = f"chunk_{i}_{doc_name}"
        ids.append(chunk_id)
        
        # Extract metadata from LangChain document
        metadata = {
            "source": document_source,
            "gcs_uri": gcs_uri if gcs_uri else None,
            "gcs_blob_name": gcs_blob_name if gcs_blob_name else None,
            "page_number": chunk.metadata.get("page", 0) if hasattr(chunk, "metadata") else 0,
            "chunk_index": i,
            "document_name": doc_filename
        }
        metadatas.append(metadata)
        contents.append(chunk.page_content)
    
    # Upsert documents into ChromaDB
    # Note: For ChromaDB, we need to provide embeddings directly
    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=contents,
        metadatas=metadatas
    )
    
    print(f"   ✅ Indexed {len(ids)} chunk(s) into ChromaDB collection '{collection_name}'")
    
    # Future integration placeholder: Vertex AI Vector Search
    # TODO: Future integration with Vertex AI Vector Search for production
    # print("7. Uploading embeddings to Vertex AI Vector Search...")
    # from google.cloud.aiplatform import vector_search
    # # Initialize Vertex AI Vector Search index
    # # Upload embeddings and metadata
    # print("   ✅ Uploaded to Vertex AI Vector Search")
    
    print("\n" + "="*70)
    print(f"✅ Ingestion pipeline completed successfully!")
    print(f"   Processed: {len(chunks)} chunks")
    print(f"   Vector Store: {vector_store_dir}")
    print(f"   Collection: {collection_name}")
    if gcs_uri:
        print(f"   GCS Location: {gcs_uri}")
    print("="*70 + "\n")
    
    return len(chunks)


def main():
    """
    Main execution function.
    Processes all PDFs from the GCS bucket.
    """
    # Configuration
    VECTOR_STORE_DIR = "./vector_store"  # Local directory for ChromaDB
    GCS_BUCKET_NAME = "minewise-bucket"  # Your GCS bucket name
    
    # Set up Google Cloud authentication
    print("Setting up Google Cloud authentication...")
    setup_google_cloud_authentication()
    print()
    
    try:
        # List all PDFs in the bucket
        print(f"📦 Listing PDFs in bucket: {GCS_BUCKET_NAME}...")
        pdf_files = list_pdfs_in_bucket(GCS_BUCKET_NAME)
        
        if not pdf_files:
            print(f"\n⚠️  No PDF files found in bucket: {GCS_BUCKET_NAME}")
            print("   Please upload PDF files to the bucket first.")
            sys.exit(1)
        
        print(f"   ✅ Found {len(pdf_files)} PDF file(s):")
        for i, pdf_file in enumerate(pdf_files, 1):
            print(f"      {i}. {pdf_file}")
        print()
        
        # Process each PDF
        total_chunks = 0
        temp_files = []  # Track temp files for cleanup
        
        for pdf_blob_name in pdf_files:
            try:
                print(f"\n{'='*70}")
                print(f"📄 Processing: {pdf_blob_name}")
                print(f"{'='*70}")
                
                # Download PDF from GCS to a temporary file
                temp_pdf_path = download_pdf_from_gcs(GCS_BUCKET_NAME, pdf_blob_name)
                temp_files.append(temp_pdf_path)
                
                # Process the PDF
                num_chunks = ingest_pdf_to_vectorstore(
                    pdf_path=temp_pdf_path,
                    vector_store_dir=VECTOR_STORE_DIR,
                    gcs_bucket_name=GCS_BUCKET_NAME,
                    gcs_blob_name=pdf_blob_name
                )
                
                total_chunks += num_chunks
                print(f"✅ Completed processing: {pdf_blob_name} ({num_chunks} chunks)")
                
            except Exception as e:
                print(f"\n❌ Error processing {pdf_blob_name}: {e}")
                import traceback
                traceback.print_exc()
                print(f"\n⚠️  Continuing with next file...")
                continue
        
        # Clean up temporary files
        print(f"\n🧹 Cleaning up temporary files...")
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except Exception as e:
                print(f"   ⚠️  Could not remove {temp_file}: {e}")
        
        print(f"\n{'='*70}")
        print(f"🎉 Successfully processed {len(pdf_files)} PDF(s) with {total_chunks} total chunk(s)!")
        print(f"{'='*70}")
        
    except Exception as e:
        print(f"\n❌ Error during ingestion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

