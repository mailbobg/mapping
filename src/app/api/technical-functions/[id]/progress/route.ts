import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const progressPercent = Number(body?.progressPercent ?? 0);

  if (Number.isNaN(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    return NextResponse.json(
      { error: "progressPercent must be between 0 and 100" },
      { status: 400 }
    );
  }

  const updated = await prisma.technicalFunction.update({
    where: { id: params.id },
    data: { progressPercent }
  });

  return NextResponse.json({ id: updated.id, progressPercent: updated.progressPercent });
}
