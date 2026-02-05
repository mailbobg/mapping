import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - List TFs that are NOT linked to this use case (available to add)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Get IDs of TFs already linked to this use case
    const linkedTFs = await prisma.useCaseTechnicalFunction.findMany({
      where: { useCaseId: id },
      select: { technicalFunctionId: true }
    });
    
    const linkedTFIds = linkedTFs.map(link => link.technicalFunctionId);

    // Get all TFs not in the linked list
    const availableTFs = await prisma.technicalFunction.findMany({
      where: {
        id: { notIn: linkedTFIds.length > 0 ? linkedTFIds : ['__none__'] }
      },
      select: {
        id: true,
        name: true,
        description: true,
        progressPercent: true,
        productFunction: {
          select: {
            id: true,
            name: true,
            feature: {
              select: {
                name: true,
                domain: {
                  select: { name: true }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { productFunction: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(availableTFs);
  } catch (error) {
    console.error("Failed to fetch available technical functions:", error);
    return NextResponse.json(
      { error: "Failed to fetch available technical functions" },
      { status: 500 }
    );
  }
}
