import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm",
  "text/plain",
]);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Non autorise." }, { status: 401 });
    }
    if (session.user.role !== "admin" && session.user.role !== "teacher") {
      return NextResponse.json({ message: "Seuls les enseignants peuvent uploader des fichiers." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "Aucun fichier fourni." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ message: "Fichier trop volumineux (max 10 MB)." }, { status: 413 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ message: "Type de fichier non autorise: " + file.type }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 100);
    const uniqueName = Date.now() + "-" + session.user.id.slice(0, 8) + "-" + safeName;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(uniqueName, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ message: "Erreur upload." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(uniqueName);

    const upload = await prisma.upload.create({
      data: { filename: file.name, mimetype: file.type, size: buffer.length, path: urlData.publicUrl },
    });

    return NextResponse.json({ url: urlData.publicUrl, id: upload.id }, { status: 201 });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
