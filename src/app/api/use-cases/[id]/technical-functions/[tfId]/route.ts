import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ id: string; tfId: string }>;
};

// DELETE - Remove a TF from a use case
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, tfId } = await params;

    // Check if the relationship exists
    const existing = await prisma.useCaseTechnicalFunction.findUnique({
      where: {
        useCaseId_technicalFunctionId: {
          useCaseId: id,
          technicalFunctionId: tfId
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Technical function is not linked to this use case" },
        { status: 404 }
      );
    }

    // Delete the relationship
    await prisma.useCaseTechnicalFunction.delete({
      where: {
        useCaseId_technicalFunctionId: {
          useCaseId: id,
          technicalFunctionId: tfId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove technical function:", error);
    return NextResponse.json(
      { error: "Failed to remove technical function" },
      { status: 500 }
    );
  }
}
