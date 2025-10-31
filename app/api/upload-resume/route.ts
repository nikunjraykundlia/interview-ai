import { NextResponse } from "next/server";
import { parsePdfResume } from "@/lib/parseResume";
import { UPLOAD_LIMIT_BYTES } from "@/lib/resumeConfig";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ message: "Unsupported Media Type" }, { status: 415 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ message: "Only application/pdf is allowed" }, { status: 415 });
    }

    if (file.size > UPLOAD_LIMIT_BYTES) {
      return NextResponse.json({ message: "File too large" }, { status: 413 });
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const parsed = await parsePdfResume(buffer);
    // Debug: print parsed resume to server logs
    console.log("[Upload-Resume API] Parsed resume:", parsed);

    return NextResponse.json(parsed, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: "Failed to parse PDF", error: e?.message || String(e) }, { status: 500 });
  }
}
