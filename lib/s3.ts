import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "";
const publicDomain = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/$/, "");

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

let r2ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!r2ClientInstance) {
    r2ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2ClientInstance;
}

export async function createPresignedUploadUrl(
  fileName: string,
  fileType: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const s3 = getR2Client();

  // Bersihkan nama file dan buat key unik: tickets/YYYYMM/uuid-cleanName
  const datePrefix = new Date().toISOString().slice(0, 7).replace("-", "");
  const randomId = crypto.randomUUID().slice(0, 8);
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
  const key = `tickets/${datePrefix}/${randomId}-${cleanName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  // URL berlaku selama 5 menit (300 detik)
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  // Domain publik R2 (contoh: https://pub-xxxx.r2.dev/tickets/... atau https://cdn.domain.com/tickets/...)
  const publicUrl = publicDomain
    ? `${publicDomain}/${key}`
    : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;

  return { uploadUrl, publicUrl, key };
}
