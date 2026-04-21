import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const body = await request.formData();

  const response = await fetch(`${API_URL}/api/v1/whatsapp/incoming`, {
    method: "POST",
    body,
  });

  const text = await response.text();
  return new NextResponse(text, {
    headers: { "Content-Type": "application/xml" },
  });
}
