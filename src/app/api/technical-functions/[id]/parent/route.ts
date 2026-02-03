import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.productFunctionId === undefined) {
      return NextResponse.json(
        { error: "productFunctionId is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.technicalFunction.update({
      where: { id },
      data: {
        productFunctionId: body.productFunctionId
      },
      select: {
        id: true,
        productFunctionId: true,
        productFunction: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update technical function parent:", error);
    return NextResponse.json(
      { error: "Failed to update technical function parent" },
      { status: 500 }
    );
  }
}
