/**
 * Vector Search & RAG Functions
 * 
 * Phase 2: Vector Database for Knowledge Retrieval
 * Uses OpenAI embeddings for semantic search
 */

import OpenAI from 'openai';
import prisma from './prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-3-large'; // 3072 dimensions, $0.00013/1K tokens
const EMBEDDING_DIMENSIONS = 3072;

/**
 * Generate embedding vector for text
 * Cost: ~$0.00013 per 1,000 tokens (6.5x more than small, 2.3% better performance)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[Vector] Error generating embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search knowledge base for relevant content using vector similarity
 * 
 * @param query - User's question or search query
 * @param options - Search options (limit, contentType, region, etc.)
 * @returns Array of relevant knowledge base entries with similarity scores
 */
export async function searchKnowledge(
  query: string,
  options: {
    limit?: number;
    contentType?: string;
    category?: string;
    region?: string;
    minSimilarity?: number;
  } = {}
) {
  const {
    limit = 5,
    contentType,
    category,
    region,
    minSimilarity = 0.7, // Only return results with >70% similarity
  } = options;

  try {
    // Generate embedding for the query
    console.log('[Vector] Generating embedding for query:', query.substring(0, 50) + '...');
    const queryEmbedding = await generateEmbedding(query);

    // Build where clause for filtering
    const where: any = { active: true };
    if (contentType) where.contentType = contentType;
    if (category) where.category = category;

    // Handle region filtering with OR logic (to include both region-specific and universal content)
    if (region) {
      where.OR = [
        { region: region },
        { region: null }
      ];
    }

    // Fetch all potential matches (with embedding)
    const candidates = await prisma.knowledgeBase.findMany({
      where: {
        ...where,
        embedding: { not: null }, // Only get items that have embeddings
      },
      orderBy: { importance: 'desc' }, // Boost important content
    });

    console.log('[Vector] Found', candidates.length, 'candidates to search');

    // Calculate similarity scores
    type Candidate = typeof candidates[number];
    type ResultWithSimilarity = Candidate & { similarity: number };
    const results: ResultWithSimilarity[] = candidates
      .map((item: Candidate) => {
        const itemEmbedding = item.embedding as any as number[];
        const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);

        return {
          ...item,
          similarity,
        };
      })
      .filter((item: ResultWithSimilarity) => item.similarity >= minSimilarity) // Filter by minimum similarity
      .sort((a: ResultWithSimilarity, b: ResultWithSimilarity) => b.similarity - a.similarity) // Sort by similarity (highest first)
      .slice(0, limit); // Limit results

    console.log('[Vector] Returning', results.length, 'results (min similarity:', minSimilarity, ')');

    return results.map((result) => ({
      id: result.id,
      content: result.content,
      title: result.title,
      contentType: result.contentType,
      category: result.category,
      region: result.region,
      similarity: result.similarity,
      sourceId: result.sourceId,
    }));
  } catch (error) {
    console.error('[Vector] Error searching knowledge:', error);
    return [];
  }
}

/**
 * Add content to knowledge base with embedding
 */
export async function addToKnowledgeBase(data: {
  content: string;
  title?: string;
  contentType: string;
  category: string;
  region?: string;
  sourceId?: string;
  keywords?: string[];
  importance?: number;
}) {
  try {
    // Generate embedding
    console.log('[Vector] Generating embedding for:', data.title || data.content.substring(0, 50));
    const embedding = await generateEmbedding(data.content);

    // Store in database
    const entry = await prisma.knowledgeBase.create({
      data: {
        content: data.content,
        title: data.title,
        contentType: data.contentType,
        category: data.category,
        region: data.region,
        sourceId: data.sourceId,
        embedding: embedding,
        keywords: data.keywords || [],
        importance: data.importance || 0,
        active: true,
      },
    });

    console.log('[Vector] Added to knowledge base:', entry.id);
    return entry;
  } catch (error) {
    console.error('[Vector] Error adding to knowledge base:', error);
    throw error;
  }
}

/**
 * Extract keywords from text for hybrid search
 * Simple implementation - can be enhanced with NLP
 */
export function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
    'just', 'should', 'now', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'would', 'could', 'this', 'that',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/) // Split into words
    .filter((word) => word.length > 3 && !commonWords.has(word)) // Filter short words and common words
    .slice(0, 10); // Limit to 10 keywords
}
