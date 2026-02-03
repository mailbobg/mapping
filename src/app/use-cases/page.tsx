import { prisma } from "@/lib/db";
import { calcAverageProgress, countCompleted } from "@/lib/progress";
import UseCaseList from "./UseCaseList";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

// Cache use cases for 60 seconds
const getUseCasesWithProgress = unstable_cache(
  async () => {
    const useCases = await prisma.useCase.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        useCaseTFs: {
          select: {
            technicalFunction: {
              select: { progressPercent: true }
            }
          }
        }
      },
      orderBy: { id: "asc" }
    });

    // Pre-calculate progress for each use case
    return useCases.map((uc) => {
      const progressValues = uc.useCaseTFs.map(
        (link) => link.technicalFunction.progressPercent ?? 0
      );
      const total = progressValues.length;
      const done = countCompleted(progressValues);
      const percent = calcAverageProgress(progressValues);
      
      return {
        id: uc.id,
        name: uc.name,
        description: uc.description,
        total,
        done,
        percent,
      };
    });
  },
  ["use-cases-list"],
  { revalidate: 60 }
);

export default async function UseCasesPage() {
  const useCasesWithProgress = await getUseCasesWithProgress();

  if (useCasesWithProgress.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-lg text-text-primary mb-2">No Use Cases Found</h1>
        <p className="text-sm text-text-muted">Please run database seeding.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="page-header">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="page-title">Use Cases</h1>
            <p className="page-subtitle">Active scenarios and progress tracking</p>
          </div>
          <div className="tag tag-accent text-sm px-3 py-1.5">
            {useCasesWithProgress.length} items
          </div>
        </div>
      </header>

      <UseCaseList data={useCasesWithProgress} />
    </div>
  );
}
