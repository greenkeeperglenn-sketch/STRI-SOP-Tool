import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth/config";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF and Word documents are allowed" },
      { status: 400 }
    );
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File size must be less than 10MB" },
      { status: 400 }
    );
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const blobPath = `sops/${timestamp}-${safeName}`;

  const blob = await put(blobPath, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({
    url: blob.url,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
  });
}
