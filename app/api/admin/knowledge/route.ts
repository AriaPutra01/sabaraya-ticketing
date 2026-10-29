import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { chunkText, generateEmbedding } from "@/lib/ai";

export async function GET() {
  await connection();

  const user = await getSession();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const user = await getSession();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, category, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Judul dan isi dokumen wajib diisi" }, { status: 400 });
    }

    const chunks = chunkText(content);
    const chunkEmbeddings: (number[] | null)[] = [];

    // Hitung seluruh embedding di memori terlebih dahulu agar transaksi DB atomik
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

    // Simpan dokumen dan seluruh chunk vektor dalam satu transaksi database atomik
    const doc = await prisma.$transaction(async (tx) => {
      const createdDoc = await tx.knowledgeDocument.create({
        data: {
          title: title.trim(),
          category: category?.trim() || "FAQ",
          content: content.trim(),
        },
      });

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const emb = chunkEmbeddings[i];
        const chunkRecord = await tx.knowledgeChunk.create({
          data: {
            documentId: createdDoc.id,
            content: chunk,
          },
        });

        if (emb) {
          const vectorStr = `[${emb.join(",")}]`;
          await tx.$executeRaw`
            UPDATE knowledge_chunks
            SET embedding = ${vectorStr}::vector
            WHERE id = ${chunkRecord.id};
          `;
        }
      }

      return createdDoc;
    });

    return NextResponse.json({
      success: true,
      document: doc,
      totalChunks: chunks.length,
    });
  } catch (error) {
    console.error("Create knowledge document error:", error);
    return NextResponse.json({ error: "Gagal menyimpan dokumen pengetahuan" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await connection();

  const user = await getSession();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID dokumen diperlukan" }, { status: 400 });
  }

  await prisma.knowledgeDocument.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
