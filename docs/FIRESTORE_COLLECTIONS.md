# Firestore Collections Structure

## Overview

Firestore collections are created automatically when you write the first document. This document describes the collection structure for Minewise AI.

## Collections

### 1. `users/{userId}`

User profile information.

**Document Fields:**
```typescript
{
  email: string;                    // User's email address
  role: 'admin' | 'user';          // User role (default: 'user')
  createdAt: Timestamp;             // Account creation time
  updatedAt: Timestamp;             // Last update time
}
```

**Rules:**
- Users can read/write their own document
- Admins can access all user documents

**Example:**
```javascript
// Collection: users
// Document ID: {firebaseAuthUID}
{
  "email": "user@example.com",
  "role": "admin",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### 2. `documents/{documentId}`

Metadata for uploaded legal documents.

**Document Fields:**
```typescript
{
  id: string;                       // Document ID (same as document ID)
  filename: string;                 // Original filename
  uploadedAt: Timestamp;            // Upload timestamp
  userId: string;                   // Owner's user ID
  size: number;                     // File size in bytes
  mimeType: string;                 // MIME type (e.g., 'application/pdf')
  chunkCount?: number;              // Number of chunks created
}
```

**Rules:**
- All authenticated users can read
- Users can create/update/delete their own documents

**Example:**
```javascript
// Collection: documents
// Document ID: {auto-generated}
{
  "id": "doc-123",
  "filename": "mining-regulation-2024.pdf",
  "uploadedAt": "2024-01-15T10:00:00Z",
  "userId": "user-abc123",
  "size": 524288,
  "mimeType": "application/pdf",
  "chunkCount": 45
}
```

---

### 3. `queryLogs/{logId}`

Log of user queries for analytics.

**Document Fields:**
```typescript
{
  userId: string;                   // User who made the query
  query: string;                    // The search query
  timestamp: Timestamp;             // Query time
  resultCount: number;              // Number of results returned
}
```

**Rules:**
- Users can only read their own query logs
- Users can create their own query logs

**Example:**
```javascript
// Collection: queryLogs
// Document ID: {auto-generated}
{
  "userId": "user-abc123",
  "query": "What are the environmental compliance requirements?",
  "timestamp": "2024-01-15T10:30:00Z",
  "resultCount": 5
}
```

---

### 4. `vectorChunks/{chunkId}`

Vector embeddings of document chunks for semantic search.

**Document Fields:**
```typescript
{
  content: string;                  // Chunk text content
  embedding: number[];              // Vector embedding (3072 dimensions)
  documentId: string;               // Source document ID
  source: string;                   // Source filename
  pageNumber: number;               // Page number in source
  embeddingDim: number;             // Embedding dimension (3072)
  createdAt: Timestamp;             // Creation timestamp
}
```

**Rules:**
- Typically accessed via backend API only
- No direct user access (handled by RAG pipeline)

**Example:**
```javascript
// Collection: vectorChunks
// Document ID: {auto-generated}
{
  "content": "Mining operations must comply with...",
  "embedding": [0.123, 0.456, ...], // Array of 3072 numbers
  "documentId": "doc-123",
  "source": "mining-regulation-2024.pdf",
  "pageNumber": 15,
  "embeddingDim": 3072,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

## Indexes

Firestore requires composite indexes for queries. See `firestore.indexes.json` for configured indexes:

1. **documents collection**: `uploadedAt DESC, userId ASC`
2. **queryLogs collection**: `userId ASC, timestamp DESC`

## Initializing Collections

Collections are created automatically when you write the first document. To verify structure:

```bash
node scripts/init-firestore.js
```

## Setting Up Admin User

To make a user an admin, update their document in the `users` collection:

```javascript
// In Firestore Console:
// Collection: users
// Document ID: {userId} (Firebase Auth UID)
{
  "email": "admin@example.com",
  "role": "admin",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

