import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const productFunctions = await prisma.productFunction.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: { id: "asc" }
    });

    return NextResponse.json(productFunctions);
  } catch (error) {
    console.error("Failed to fetch product functions:", error);
    return NextResponse.json(
      { error: "Failed to fetch product functions" },
      { status: 500 }
    );
  }
}
