import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { chunkText, generateEmbedding } from "@/lib/ai";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";

export async function GET() {
  await connection();

  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  const documents = await prisma.knowledgeDocument.findMany({
    include: {
      _count: {
        select: { chunks: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  await connection();

  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const { title, category, content } = await req.json();

    if (!title || !content) {
      return apiError("Judul dan isi dokumen wajib diisi", 400);
    }

    const chunks = chunkText(content);
    const chunkEmbeddings: (number[] | null)[] = [];

    if (process.env.OPENROUTER_API_KEY) {
      for (const chunk of chunks) {
        const emb = await generateEmbedding(chunk);
        chunkEmbeddings.push(emb);
      }
    } else {
      for (let i = 0; i < chunks.length; i++) {
        chunkEmbeddings.push(null);
      }
    }

    const doc = await prisma.$transaction(async (tx) => {
      const createdDoc = await tx.knowledgeDocument.create({
        data: {
          title,
          category: category || "Umum",
          content,
        },
      });

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = chunkEmbeddings[i];

        if (embedding) {
          const vectorStr = `[${embedding.join(",")}]`;
          await tx.$executeRaw`
            INSERT INTO "knowledge_chunks" ("id", "documentId", "content", "embedding", "createdAt")
            VALUES (gen_random_uuid()::text, ${createdDoc.id}, ${chunk}, ${vectorStr}::vector, NOW());
          `;
        } else {
          await tx.knowledgeChunk.create({
            data: {
              documentId: createdDoc.id,
              content: chunk,
            },
          });
        }
      }

      return createdDoc;
    });

    return apiSuccess({
      document: doc,
      totalChunks: chunks.length,
    });
  } catch (error) {
    return handleRouteError(error, "Gagal menyimpan dokumen pengetahuan");
  }
}

export async function DELETE(req: NextRequest) {
  await connection();

  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return apiError("ID dokumen diperlukan", 400);
  }

  try {
    await prisma.knowledgeDocument.delete({
      where: { id },
    });

    return apiSuccess(undefined, "Dokumen pengetahuan berhasil dihapus.");
  } catch (error) {
    return handleRouteError(error, "Gagal menghapus dokumen pengetahuan.");
  }
}
