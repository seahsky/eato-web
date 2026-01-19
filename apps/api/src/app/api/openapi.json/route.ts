import { getOpenApiDocument } from "@/lib/openapi";

export async function GET() {
  const openApiDocument = getOpenApiDocument();
  return Response.json(openApiDocument);
}
