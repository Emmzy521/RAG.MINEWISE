"""
Sync ChromaDB to Firestore
===========================
This script reads vector embeddings from ChromaDB (local) and syncs them
to Firestore 'vectorChunks' collection for use by the TypeScript retrieval system.

This bridges the gap between:
- Python ingestion pipeline (stores in ChromaDB)
- TypeScript retrieval system (reads from Firestore)
"""

import os
import sys
from typing import List, Dict, Any

# Google Cloud imports
from google.cloud import firestore
from google.auth import default as google_auth_default
import chromadb
from chromadb.config import Settings


def setup_google_cloud_authentication():
    """
    Set up Google Cloud authentication for Firestore.
    """
    try:
        credentials, project_id = google_auth_default()
        if project_id:
            print(f"✅ Google Cloud authentication successful (Project: {project_id})")
            return project_id
        else:
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT_ID")
            if project_id:
                print(f"✅ Google Cloud authentication successful (Project: {project_id})")
                return project_id
            else:
                raise ValueError("Could not determine GCP project ID")
    except Exception as e:
        print(f"❌ Error: Google Cloud authentication failed: {e}")
        raise


def sync_chromadb_to_firestore(
    chromadb_dir: str = "./vector_store",
    collection_name: str = "pdf_documents",
    firestore_collection: str = "vectorChunks"
):
    """
    Sync all chunks from ChromaDB to Firestore.
    
    Args:
        chromadb_dir (str): Path to ChromaDB directory
        collection_name (str): ChromaDB collection name
        firestore_collection (str): Firestore collection name
    """
    print("\n" + "="*70)
    print("🔄 Syncing ChromaDB to Firestore")
    print("="*70 + "\n")
    
    # Setup authentication
    print("1. Setting up Google Cloud authentication...")
    project_id = setup_google_cloud_authentication()
    print()
    
    # Initialize ChromaDB client
    print(f"2. Connecting to ChromaDB at '{chromadb_dir}'...")
    try:
        chroma_client = chromadb.PersistentClient(
            path=chromadb_dir,
            settings=Settings(anonymized_telemetry=False)
        )
        collection = chroma_client.get_collection(name=collection_name)
        print(f"   ✅ Connected to ChromaDB collection: {collection_name}")
    except Exception as e:
        print(f"   ❌ Error connecting to ChromaDB: {e}")
        raise
    
    # Get all documents from ChromaDB
    print(f"3. Retrieving all chunks from ChromaDB...")
    try:
        results = collection.get(include=["documents", "embeddings", "metadatas"])
        
        if not results["ids"] or len(results["ids"]) == 0:
            print("   ⚠️  No documents found in ChromaDB collection")
            return 0
        
        num_chunks = len(results["ids"])
        print(f"   ✅ Found {num_chunks} chunk(s) in ChromaDB")
    except Exception as e:
        print(f"   ❌ Error retrieving from ChromaDB: {e}")
        raise
    
    # Initialize Firestore client
    print(f"4. Connecting to Firestore...")
    try:
        db = firestore.Client(project=project_id)
        firestore_ref = db.collection(firestore_collection)
        print(f"   ✅ Connected to Firestore collection: {firestore_collection}")
    except Exception as e:
        print(f"   ❌ Error connecting to Firestore: {e}")
        raise
    
    # Sync each chunk to Firestore
    print(f"5. Syncing chunks to Firestore...")
    synced_count = 0
    skipped_count = 0
    
    for i, (chunk_id, document, embedding, metadata) in enumerate(
        zip(results["ids"], results["documents"], results["embeddings"], results["metadatas"]),
        1
    ):
        try:
            # Extract metadata
            source = metadata.get("source", "") if metadata else ""
            gcs_uri = metadata.get("gcs_uri", "") if metadata else ""
            gcs_blob_name = metadata.get("gcs_blob_name", "") if metadata else ""
            page_number = metadata.get("page_number", 0) if metadata else 0
            chunk_index = metadata.get("chunk_index", 0) if metadata else 0
            document_name = metadata.get("document_name", "") if metadata else ""
            
            # Convert embedding to list if it's a NumPy array or other type
            if embedding is not None:
                if hasattr(embedding, 'tolist'):
                    embedding_list = embedding.tolist()
                elif isinstance(embedding, list):
                    embedding_list = embedding
                else:
                    embedding_list = list(embedding)
                embedding_dim = len(embedding_list)
            else:
                embedding_list = []
                embedding_dim = 768
            
            # Create document ID from chunk_id (ChromaDB ID) or generate one
            # Use chunk_id if it's a valid Firestore document ID format
            firestore_doc_id = chunk_id if chunk_id and len(chunk_id) > 0 else f"chunk_{i}"
            
            # Prepare Firestore document
            firestore_doc = {
                "content": document,
                "embedding": embedding_list,
                "documentId": gcs_blob_name or document_name or source,
                "source": gcs_uri or source,
                "pageNumber": page_number,
                "chunkIndex": chunk_index,
                "documentName": document_name,
                "embeddingDim": embedding_dim,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "syncedFrom": "chromadb",
                "chromadbId": chunk_id
            }
            
            # Check if document already exists (upsert behavior)
            doc_ref = firestore_ref.document(firestore_doc_id)
            existing_doc = doc_ref.get()
            
            if existing_doc.exists:
                # Update existing document
                doc_ref.update(firestore_doc)
                action = "updated"
            else:
                # Create new document
                doc_ref.set(firestore_doc)
                action = "created"
            
            synced_count += 1
            
            if i % 10 == 0:
                print(f"   Progress: {i}/{num_chunks} chunks synced...")
            
        except Exception as e:
            print(f"   ⚠️  Error syncing chunk {chunk_id}: {e}")
            skipped_count += 1
            continue
    
    print(f"\n   ✅ Successfully synced {synced_count} chunk(s)")
    if skipped_count > 0:
        print(f"   ⚠️  Skipped {skipped_count} chunk(s) due to errors")
    
    print("\n" + "="*70)
    print(f"🎉 Sync completed!")
    print(f"   Synced: {synced_count} chunks")
    print(f"   Skipped: {skipped_count} chunks")
    print(f"   Firestore Collection: {firestore_collection}")
    print("="*70 + "\n")
    
    return synced_count


def main():
    """
    Main execution function.
    """
    # Configuration
    CHROMADB_DIR = "./vector_store"
    CHROMADB_COLLECTION = "pdf_documents"
    FIRESTORE_COLLECTION = "vectorChunks"
    
    try:
        synced_count = sync_chromadb_to_firestore(
            chromadb_dir=CHROMADB_DIR,
            collection_name=CHROMADB_COLLECTION,
            firestore_collection=FIRESTORE_COLLECTION
        )
        
        if synced_count > 0:
            print(f"\n✅ Successfully synced {synced_count} chunks to Firestore!")
            print("\n📝 Next steps:")
            print("   1. Implement getQuestionVector() in TypeScript to use Vertex AI")
            print("   2. Test the RAG pipeline end-to-end")
        else:
            print("\n⚠️  No chunks were synced. Check if ChromaDB has data.")
            sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Error during sync: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

