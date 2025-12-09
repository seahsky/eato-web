import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const primaryEmail = email_addresses.find(
      (e) => e.id === evt.data.primary_email_address_id
    );

    await prisma.user.create({
      data: {
        clerkId: id,
        email: primaryEmail?.email_address || "",
        name: [first_name, last_name].filter(Boolean).join(" ") || null,
      },
    });
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const primaryEmail = email_addresses.find(
      (e) => e.id === evt.data.primary_email_address_id
    );

    await prisma.user.update({
      where: { clerkId: id },
      data: {
        email: primaryEmail?.email_address,
        name: [first_name, last_name].filter(Boolean).join(" ") || null,
      },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      // First unlink partner if exists
      const user = await prisma.user.findUnique({
        where: { clerkId: id },
        select: { id: true, partnerId: true },
      });

      if (user?.partnerId) {
        await prisma.user.update({
          where: { id: user.partnerId },
          data: { partnerId: null },
        });
      }

      // Then delete the user (cascades to profile, food entries, daily logs)
      await prisma.user.delete({
        where: { clerkId: id },
      });
    }
  }

  return new Response("OK", { status: 200 });
}
