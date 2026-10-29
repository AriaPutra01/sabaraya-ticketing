import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  headers: {
    "HTTP-Referer": "https://ticketing.sabaraya.my.id",
    "X-Title": "Sabaraya Ticketing AI CS",
  },
});

export const CHAT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-6-luna";
export const EMBEDDING_MODEL = process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

export function chunkText(text: string, chunkSize = 600, overlap = 80): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= chunkSize) return [clean];

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = start + chunkSize;
    if (end < clean.length) {
      // Cari batas pemisah alami terdekat (paragraf, baris baru, atau spasi)
      const lastBreak = clean.lastIndexOf("\n\n", end);
      const lastLine = clean.lastIndexOf("\n", end);
      const lastSpace = clean.lastIndexOf(" ", end);

      if (lastBreak > start + chunkSize / 2) {
        end = lastBreak;
      } else if (lastLine > start + chunkSize / 2) {
        end = lastLine;
      } else if (lastSpace > start + chunkSize / 2) {
        end = lastSpace;
      }
    } else {
      end = clean.length;
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    if (end >= clean.length) break;
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.replace(/\n+/g, " ").trim(),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding API error: ${errText}`);
  }

  const json = await res.json();
  return json.data[0].embedding;
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
}

export async function searchKnowledgeBase(query: string, limit = 4): Promise<KnowledgeSearchResult[]> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return [];
    }

    const embedding = await generateEmbedding(query);
    const vectorString = `[${embedding.join(",")}]`;

    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        category: string;
        content: string;
        similarity: number;
      }>
    >`
      SELECT
        c.id,
        d.title,
        d.category,
        c.content,
        1 - (c.embedding <=> ${vectorString}::vector) AS similarity
      FROM knowledge_chunks c
      JOIN knowledge_documents d ON d.id = c."documentId"
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${vectorString}::vector
      LIMIT ${limit};
    `;

    return rows.filter((r) => r.similarity > 0.25);
  } catch (error) {
    console.error("Knowledge base search error:", error);
    return [];
  }
}
