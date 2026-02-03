import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const features = await prisma.feature.findMany({
      select: {
        id: true,
        name: true,
        domain: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { domain: { name: "asc" } },
        { name: "asc" }
      ]
    });

    return NextResponse.json(features);
  } catch (error) {
    console.error("Failed to fetch features:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}
