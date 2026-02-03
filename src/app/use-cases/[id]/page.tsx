import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import UseCaseNavigator from "./UseCaseNavigator";
import UseCaseContent from "./UseCaseContent";
import { unstable_cache } from "next/cache";

type PageProps = {
  params: Promise<{ id: string }>;
};

function uniqueBy<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(keyFn(item), item);
  }
  return Array.from(map.values());
}

// Cache navigation data for 5 minutes (changes less frequently)
const getUseCaseNavigation = unstable_cache(
  async () => {
    return prisma.useCase.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" }
    });
  },
  ["use-case-navigation"],
  { revalidate: 300 }
);

export default async function UseCaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  // Parallel fetch: navigation data and use case details
  const [allUseCases, useCase] = await Promise.all([
    getUseCaseNavigation(),
    prisma.useCase.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        useCaseTFs: {
          select: {
            technicalFunction: {
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
                        id: true,
                        name: true,
                        domain: {
                          select: { id: true, name: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  ]);
  
  const currentIndex = allUseCases.findIndex(uc => uc.id === id);
  const prevUseCase = currentIndex > 0 ? allUseCases[currentIndex - 1] : null;
  const nextUseCase = currentIndex < allUseCases.length - 1 ? allUseCases[currentIndex + 1] : null;

  if (!useCase) {
    notFound();
  }

  const tfLinks = useCase.useCaseTFs;

  // Get unique product function IDs from the technical functions, sorted by ID
  const pfIds = uniqueBy(
    tfLinks
      .map((link) => link.technicalFunction.productFunction)
      .filter(Boolean) as NonNullable<
      (typeof tfLinks)[number]["technicalFunction"]["productFunction"]
    >[],
    (pf) => pf.id
  ).map((pf) => pf.id).sort();

  // Only fetch product functions if there are IDs
  const pfListUnsorted = pfIds.length
    ? await prisma.productFunction.findMany({
        where: { id: { in: pfIds } },
        select: {
          id: true,
          name: true,
          feature: {
            select: {
              name: true,
              domain: { select: { name: true } }
            }
          },
          technicalFunctions: {
            select: { progressPercent: true }
          }
        }
      })
    : [];
  
  // Sort pfList to match pfIds order
  const pfList = pfIds.map(id => pfListUnsorted.find(pf => pf.id === id)!).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <UseCaseNavigator 
        currentId={id}
        currentIndex={currentIndex}
        totalCount={allUseCases.length}
        prevUseCase={prevUseCase}
        nextUseCase={nextUseCase}
        allUseCases={allUseCases}
      />

      {/* Main Content - Client Component for reactive updates */}
      <UseCaseContent 
        useCase={{
          id: useCase.id,
          name: useCase.name,
          description: useCase.description,
        }}
        tfLinks={tfLinks}
        pfList={pfList}
        pfIds={pfIds}
      />
    </div>
  );
}
