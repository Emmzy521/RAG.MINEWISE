"""
Document Processing Script for RAG System
Processes PDFs and generates embeddings for Firestore storage.
"""

import os
import sys
from typing import List, Dict, Any
from google.cloud import storage
from google.cloud import firestore
from google.cloud import aiplatform
from google.cloud.aiplatform import TextEmbeddingModel
import pdfplumber
from datetime import datetime
import numpy as np

# Configuration
PROJECT_ID = os.getenv("PROJECT_ID", "minewise-ai-4a4da")
GCS_BUCKET_NAME = "minewise-bucket"
REGION = "us-central1"
LOCATION = "us-central1"

# Initialize clients
storage_client = storage.Client(project=PROJECT_ID)
firestore_client = firestore.Client(project=PROJECT_ID)
aiplatform.init(project=PROJECT_ID, location=LOCATION)

def extract_text_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract text from PDF with page information."""
    text_items = []
    
    with pdfplumber.open(pdf_bytes) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text and text.strip():
                text_items.append({
                    "text": text.strip(),
                    "page": page_num,
                    "metadata": {
                        "page_number": page_num,
                        "total_pages": len(pdf.pages)
                    }
                })
    
    return text_items

def chunk_text_intelligent(
    text_items: List[Dict[str, Any]], 
    max_tokens: int = 500, 
    overlap_tokens: int = 50
) -> List[Dict[str, Any]]:
    """Intelligent text chunking with overlap."""
    chunks = []
    
    for item in text_items:
        text = item["text"]
        page = item["page"]
        
        # Simple sentence-based chunking
        sentences = text.split('. ')
        current_chunk = ""
        current_tokens = 0
        
        for sentence in sentences:
            sentence_tokens = len(sentence.split())
            
            if current_tokens + sentence_tokens > max_tokens and current_chunk:
                # Save current chunk
                chunks.append({
                    "text": current_chunk.strip(),
                    "page": page,
                    "tokens": current_tokens,
                    "metadata": item["metadata"]
                })
                
                # Start new chunk with overlap
                overlap_text = '. '.join(current_chunk.split('. ')[-2:])
                current_chunk = overlap_text + '. ' + sentence
                current_tokens = len(current_chunk.split())
            else:
                current_chunk += '. ' + sentence if current_chunk else sentence
                current_tokens += sentence_tokens
        
        # Add final chunk
        if current_chunk.strip():
            chunks.append({
                "text": current_chunk.strip(),
                "page": page,
                "tokens": current_tokens,
                "metadata": item["metadata"]
            })
    
    return chunks

def generate_embeddings(
    texts: List[str], 
    model_name: str = "text-embedding-004",
    task_type: str = "RETRIEVAL_DOCUMENT"
) -> List[List[float]]:
    """Generate embeddings using Vertex AI."""
    try:
        model = TextEmbeddingModel.from_pretrained(model_name)
        
        embeddings = model.get_embeddings(
            texts,
            output_dimensionality=768,  # Cost-optimized dimension
            task_type=task_type
        )
        
        return [list(emb.values) for emb in embeddings]
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        raise

def store_in_firestore(
    collection_name: str,
    document_name: str,
    chunks: List[Dict[str, Any]],
    embeddings: List[List[float]]
) -> None:
    """Store chunks and embeddings in Firestore."""
    
    # Create document metadata
    doc_ref = firestore_client.collection(collection_name).document(document_name)
    doc_ref.set({
        "name": document_name,
        "total_chunks": len(chunks),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "status": "processed"
    })
    
    # Store chunks in subcollection
    chunks_ref = doc_ref.collection("chunks")
    batch = firestore_client.batch()
    batch_count = 0
    
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_doc = chunks_ref.document(f"chunk_{i:04d}")
        
        chunk_data = {
            "text": chunk["text"],
            "page": chunk["page"],
            "chunk_index": i,
            "tokens": chunk["tokens"],
            "embedding": embedding,
            "metadata": chunk["metadata"],
            "created_at": datetime.utcnow()
        }
        
        batch.set(chunk_doc, chunk_data)
        batch_count += 1
        
        # Commit batch every 500 operations (Firestore limit)
        if batch_count >= 500:
            batch.commit()
            batch = firestore_client.batch()
            batch_count = 0
            print(f"  Committed batch of 500 chunks...")
    
    # Commit remaining chunks
    if batch_count > 0:
        batch.commit()
        print(f"  Committed final batch of {batch_count} chunks...")

def process_document(gcs_path: str, collection_name: str, document_name: str):
    """Main processing function."""
    print(f"Processing {document_name} from {gcs_path}...")
    
    # Download from GCS
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(gcs_path)
    pdf_bytes = blob.download_as_bytes()
    
    # Extract text
    print("Extracting text...")
    text_items = extract_text_from_pdf(pdf_bytes)
    
    # Chunk text
    print("Chunking text...")
    chunks = chunk_text_intelligent(text_items, max_tokens=500, overlap_tokens=50)
    print(f"Created {len(chunks)} chunks")
    
    # Generate embeddings in batches
    print("Generating embeddings...")
    batch_size = 20  # Avoid token limits
    all_embeddings = []
    
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i + batch_size]
        batch_texts = [chunk["text"] for chunk in batch_chunks]
        
        print(f"Processing batch {i // batch_size + 1}/{(len(chunks) + batch_size - 1) // batch_size}")
        batch_embeddings = generate_embeddings(batch_texts)
        all_embeddings.extend(batch_embeddings)
    
    # Store in Firestore
    print("Storing in Firestore...")
    store_in_firestore(collection_name, document_name, chunks, all_embeddings)
    
    print(f"✅ Successfully processed {document_name}")

if __name__ == "__main__":
    # Example usage
    # TODO: Update this list with your actual PDF files from the minewise-bucket
    # Format: 
    #   - gcs_path: Path to the PDF file inside the bucket (e.g., "reports/annual_report_2024.pdf")
    #   - collection: Firestore collection name to store the document in (e.g., "reports", "policies", "frameworks")
    #   - name: Document ID in Firestore (e.g., "annual_report_2024")
    documents = [
        {
            "gcs_path": "frameworks/iso27001.pdf",  # Update with your actual path
            "collection": "frameworks", 
            "name": "iso27001"
        },
        {
            "gcs_path": "frameworks/nist.pdf",  # Update with your actual path
            "collection": "frameworks",
            "name": "nist"
        }
    ]
    
    for doc in documents:
        try:
            process_document(doc["gcs_path"], doc["collection"], doc["name"])
        except Exception as e:
            print(f"❌ Error processing {doc['name']}: {e}")

