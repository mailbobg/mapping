import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - List all TFs for a use case
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const useCase = await prisma.useCase.findUnique({
      where: { id },
      select: {
        useCaseTFs: {
          select: {
            technicalFunction: {
              select: {
                id: true,
                name: true,
                progressPercent: true,
                productFunction: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!useCase) {
      return NextResponse.json({ error: "Use case not found" }, { status: 404 });
    }

    const technicalFunctions = useCase.useCaseTFs.map(link => link.technicalFunction);
    return NextResponse.json(technicalFunctions);
  } catch (error) {
    console.error("Failed to fetch technical functions:", error);
    return NextResponse.json(
      { error: "Failed to fetch technical functions" },
      { status: 500 }
    );
  }
}

// POST - Add a TF to a use case
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { technicalFunctionId } = body;

    if (!technicalFunctionId) {
      return NextResponse.json(
        { error: "technicalFunctionId is required" },
        { status: 400 }
      );
    }

    // Check if the relationship already exists
    const existing = await prisma.useCaseTechnicalFunction.findUnique({
      where: {
        useCaseId_technicalFunctionId: {
          useCaseId: id,
          technicalFunctionId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Technical function is already linked to this use case" },
        { status: 409 }
      );
    }

    // Create the relationship
    const created = await prisma.useCaseTechnicalFunction.create({
      data: {
        useCaseId: id,
        technicalFunctionId
      },
      select: {
        technicalFunction: {
          select: {
            id: true,
            name: true,
            progressPercent: true,
            productFunction: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(created.technicalFunction, { status: 201 });
  } catch (error) {
    console.error("Failed to add technical function:", error);
    return NextResponse.json(
      { error: "Failed to add technical function" },
      { status: 500 }
    );
  }
}
