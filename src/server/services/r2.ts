import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
