import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const progressPercent = Number(body?.progressPercent ?? 0);

    if (Number.isNaN(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      return NextResponse.json(
        { error: "progressPercent must be between 0 and 100" },
        { status: 400 }
      );
    }

    const updated = await prisma.technicalFunction.update({
      where: { id },
      data: { progressPercent }
    });

    return NextResponse.json({ id: updated.id, progressPercent: updated.progressPercent });
  } catch (error) {
    console.error("Failed to update progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
