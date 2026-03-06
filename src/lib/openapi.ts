import { generateOpenApiDocument } from "trpc-to-openapi";
import { appRouter } from "@/server/routers";

export function getOpenApiDocument() {
  return generateOpenApiDocument(appRouter, {
    title: "Eato API",
    version: "1.0.0",
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    docsUrl: "https://eato.app/docs",
    description: "API for Eato - A calorie tracking app for couples",
  });
}
