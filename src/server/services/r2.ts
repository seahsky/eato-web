import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadImage(
  base64: string,
  userId: string,
  mealGroupId: string
): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const key = `food-photos/${userId}/${mealGroupId}.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

export interface PresignedPhotoUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

const PRESIGN_TTL_SECONDS = 5 * 60;

export async function presignFoodPhotoUpload(
  userId: string,
  contentType: string
): Promise<PresignedPhotoUpload> {
  const ext = contentType === "image/png" ? "png" : "jpg";
  const key = `food-photos/${userId}/${crypto.randomUUID()}.${ext}`;
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: PRESIGN_TTL_SECONDS }
  );
  return {
    uploadUrl,
    publicUrl: `${R2_PUBLIC_URL}/${key}`,
    key,
  };
}
