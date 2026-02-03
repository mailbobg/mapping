import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: {
      featureId?: string;
      tags?: string[];
    } = {};

    if (body.featureId !== undefined) {
      updateData.featureId = body.featureId;
    }
    
    if (body.tags !== undefined) {
      updateData.tags = body.tags;
    }

    const updated = await prisma.productFunction.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        featureId: true,
        tags: true,
        feature: {
          select: {
            id: true,
            name: true,
            domain: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update product function:", error);
    return NextResponse.json(
      { error: "Failed to update product function" },
      { status: 500 }
    );
  }
}
