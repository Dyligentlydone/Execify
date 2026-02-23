import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: PNG, JPG, WebP, PDF" },
                { status: 400 }
            );
        }

        const ext = file.name.split(".").pop() || "bin";
        const filename = `${randomUUID()}.${ext}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        const { data, error } = await supabase.storage
            .from("receipts")
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error("Supabase storage error:", error);
            return NextResponse.json({ error: "Failed to upload to storage" }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage
            .from("receipts")
            .getPublicUrl(filename);

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error) {
        console.error("Upload failed:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
