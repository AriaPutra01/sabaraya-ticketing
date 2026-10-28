import { NextRequest, NextResponse } from "next/server";
import { isR2Configured, createPresignedUploadUrl } from "@/lib/s3";
import { z } from "zod";

const fileItemSchema = z.object({
  fileName: z.string().min(1, "Nama file wajib ada"),
  fileType: z.string().refine(
    (type) => ["image/jpeg", "image/png", "image/webp"].includes(type),
    "Hanya format gambar JPG, PNG, atau WEBP yang diperbolehkan"
  ),
  fileSize: z.number().max(5 * 1024 * 1024, "Ukuran file maksimal 5MB per foto"),
});

const presignRequestSchema = z.object({
  files: z
    .array(fileItemSchema)
    .min(1, "Minimal pilih 1 foto")
    .max(3, "Maksimal hanya dapat melampirkan 3 foto"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files } = presignRequestSchema.parse(body);

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          success: false,
          r2Configured: false,
          message:
            "Kredensial Cloudflare R2 belum disetel di server (.env). Hubungi administrator untuk mengisi R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, dan R2_BUCKET_NAME.",
        },
        { status: 503 }
      );
    }

    const items = await Promise.all(
      files.map(async (f) => {
        const result = await createPresignedUploadUrl(f.fileName, f.fileType);
        return {
          fileName: f.fileName,
          uploadUrl: result.uploadUrl,
          publicUrl: result.publicUrl,
          key: result.key,
        };
      })
    );

    return NextResponse.json({
      success: true,
      r2Configured: true,
      items,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Validasi gagal" },
        { status: 400 }
      );
    }
    console.error("Gagal membuat Presigned URL R2:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat menyiapkan tautan unggah." },
      { status: 500 }
    );
  }
}
