import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ message: "Aucun fichier." }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(uniqueName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    return NextResponse.json({ message: "Erreur upload: " + error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("uploads")
    .getPublicUrl(uniqueName);

  const upload = await prisma.upload.create({
    data: { filename: file.name, mimetype: file.type, size: buffer.length, path: urlData.publicUrl },
  });

  return NextResponse.json({ url: urlData.publicUrl, id: upload.id }, { status: 201 });
}
