/**
 * Vector utilities for working with embeddings
 * Supports both JSON storage (temporary) and pgvector (when available)
 */

export const vectorUtils = {
  /**
   * Convert a number array to JSON for temporary storage
   * Used until pgvector is fully configured
   */
  toJson(vector: number[]): number[] {
    if (!Array.isArray(vector)) {
      throw new Error('Vector must be an array of numbers');
    }
    if (vector.length !== 768) {
      throw new Error('Vector must have exactly 768 dimensions');
    }
    return vector;
  },

  /**
   * Convert JSON back to number array
   */
  fromJson(json: unknown): number[] {
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid vector JSON');
    }
    const vector = json as number[];
    if (!Array.isArray(vector) || vector.length !== 768) {
      throw new Error('Invalid vector dimensions');
    }
    return vector;
  },

  /**
   * Calculate cosine similarity between two vectors
   * This works with JSON-stored vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i];
      const bVal = b[i];
      if (aVal === undefined || bVal === undefined) {
        throw new Error(`Undefined values found at index ${i}`);
      }
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  },

  /**
   * Calculate Euclidean distance between two vectors
   */
  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const aVal = a[i];
      const bVal = b[i];
      if (aVal === undefined || bVal === undefined) {
        throw new Error(`Undefined values found at index ${i}`);
      }
      const diff = aVal - bVal;
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  },

  /**
   * Normalize a vector to unit length
   */
  normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) {
      return vector;
    }
    return vector.map(val => val / magnitude);
  },

  /**
   * Find k-nearest neighbors from a set of vectors
   */
  findNearestNeighbors(
    query: number[],
    vectors: Array<{ id: string; vector: number[] }>,
    k: number = 5,
    metric: 'cosine' | 'euclidean' = 'cosine'
  ): Array<{ id: string; similarity: number }> {
    const similarities = vectors.map(item => {
      const similarity = metric === 'cosine'
        ? this.cosineSimilarity(query, item.vector)
        : 1 / (1 + this.euclideanDistance(query, item.vector)); // Convert distance to similarity
      
      return {
        id: item.id,
        similarity,
      };
    });

    // Sort by similarity (descending) and take top k
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  },

  /**
   * Create a placeholder vector for testing
   */
  createTestVector(seed: number = 0): number[] {
    const vector: number[] = [];
    for (let i = 0; i < 768; i++) {
      // Create deterministic but varied values
      vector.push(Math.sin(seed + i) * 0.5 + 0.5);
    }
    return vector;
  },

  /**
   * SQL template for pgvector similarity search (for future use)
   */
  pgvectorSimilarityQuery(tableName: string, limit: number = 10): string {
    return `
      SELECT 
        id,
        1 - (embedding <=> $1::vector) as similarity
      FROM ${tableName}
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT ${limit}
    `;
  },

  /**
   * SQL template for pgvector range search (for future use)
   */
  pgvectorRangeQuery(tableName: string, maxDistance: number): string {
    return `
      SELECT 
        id,
        embedding <-> $1::vector as distance
      FROM ${tableName}
      WHERE embedding IS NOT NULL
        AND embedding <-> $1::vector < ${maxDistance}
      ORDER BY embedding <-> $1::vector
    `;
  },
};