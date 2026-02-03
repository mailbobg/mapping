import { prisma } from "@/lib/db";
import StructureList from "@/components/StructureList";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

// Cache the data for 60 seconds
const getProductFunctions = unstable_cache(
  async () => {
    return prisma.productFunction.findMany({
      select: {
        id: true,
        name: true,
        descriptionEn: true,
        tags: true,
        feature: {
          select: {
            id: true,
            name: true,
            domain: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        technicalFunctions: {
          select: {
            id: true,
            name: true,
            description: true,
            state: true,
            progressPercent: true
          },
          orderBy: { id: "asc" }
        }
      },
      orderBy: { id: "asc" }
    });
  },
  ["product-functions"],
  { revalidate: 60 }
);

type PageProps = {
  searchParams: Promise<{ pf?: string }>;
};

export default async function StructurePage({ searchParams }: PageProps) {
  const { pf: highlightPfId } = await searchParams;
  const productFunctions = await getProductFunctions();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="page-header">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="page-title">Function Structure</h1>
            <p className="page-subtitle">Manage technical implementation progress</p>
          </div>
          <div className="hidden sm:block tag tag-accent text-sm px-3 py-1.5">
            {productFunctions.length} items
          </div>
        </div>
      </header>

      <StructureList data={productFunctions} highlightPfId={highlightPfId} />
    </div>
  );
}
