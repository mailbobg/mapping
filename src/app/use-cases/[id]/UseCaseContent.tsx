"use client";

import { useState, useCallback, useMemo } from "react";
import ProgressEditor from "@/components/ProgressEditor";
import { calcAverageProgress, countCompleted } from "@/lib/progress";

// Color palette for distinguishing Product Functions
const PF_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", bar: "bg-blue-400", tag: "bg-blue-100 text-blue-700" },
  { bg: "bg-amber-50", border: "border-amber-200", bar: "bg-amber-400", tag: "bg-amber-100 text-amber-700" },
  { bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-400", tag: "bg-emerald-100 text-emerald-700" },
  { bg: "bg-violet-50", border: "border-violet-200", bar: "bg-violet-400", tag: "bg-violet-100 text-violet-700" },
  { bg: "bg-rose-50", border: "border-rose-200", bar: "bg-rose-400", tag: "bg-rose-100 text-rose-700" },
  { bg: "bg-cyan-50", border: "border-cyan-200", bar: "bg-cyan-400", tag: "bg-cyan-100 text-cyan-700" },
  { bg: "bg-orange-50", border: "border-orange-200", bar: "bg-orange-400", tag: "bg-orange-100 text-orange-700" },
  { bg: "bg-indigo-50", border: "border-indigo-200", bar: "bg-indigo-400", tag: "bg-indigo-100 text-indigo-700" },
  { bg: "bg-teal-50", border: "border-teal-200", bar: "bg-teal-400", tag: "bg-teal-100 text-teal-700" },
  { bg: "bg-pink-50", border: "border-pink-200", bar: "bg-pink-400", tag: "bg-pink-100 text-pink-700" },
];

type TechnicalFunction = {
  id: string;
  name: string;
  description: string | null;
  progressPercent: number | null;
  productFunction: {
    id: string;
  } | null;
};

type TfLink = {
  technicalFunction: TechnicalFunction;
};

type ProductFunction = {
  id: string;
  name: string;
  feature: {
    name: string;
    domain: { name: string } | null;
  } | null;
  technicalFunctions: { progressPercent: number | null }[];
};

type Props = {
  useCase: {
    id: string;
    name: string;
    description: string | null;
  };
  tfLinks: TfLink[];
  pfList: ProductFunction[];
  pfIds: string[];
};

export default function UseCaseContent({ useCase, tfLinks, pfList, pfIds }: Props) {
  // Track TF progress values in client state
  const [tfProgressMap, setTfProgressMap] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    tfLinks.forEach((link) => {
      map.set(link.technicalFunction.id, link.technicalFunction.progressPercent ?? 0);
    });
    return map;
  });

  // Update progress for a specific TF
  const handleProgressChange = useCallback((tfId: string, newValue: number) => {
    setTfProgressMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(tfId, newValue);
      return newMap;
    });
  }, []);

  // Calculate Use Case progress from current state
  const { percent, done, total, isComplete, isActive } = useMemo(() => {
    const progressValues = Array.from(tfProgressMap.values());
    const total = progressValues.length;
    const done = countCompleted(progressValues);
    const percent = calcAverageProgress(progressValues);
    return {
      percent,
      done,
      total,
      isComplete: percent >= 100,
      isActive: percent > 0 && percent < 100,
    };
  }, [tfProgressMap]);

  // Create color mapping for PFs
  const pfColorMap = useMemo(() => {
    const map = new Map<string, typeof PF_COLORS[number]>();
    pfIds.forEach((pfId, index) => {
      map.set(pfId, PF_COLORS[index % PF_COLORS.length]);
    });
    return map;
  }, [pfIds]);

  // Calculate PF progress from current TF state
  const pfProgressMap = useMemo(() => {
    const map = new Map<string, { percent: number; done: number; total: number }>();
    pfList.forEach((pf) => {
      const tfIdsInPf = tfLinks
        .filter((link) => link.technicalFunction.productFunction?.id === pf.id)
        .map((link) => link.technicalFunction.id);
      const values = tfIdsInPf.map((id) => tfProgressMap.get(id) ?? 0);
      if (values.length > 0) {
        map.set(pf.id, {
          percent: calcAverageProgress(values),
          done: countCompleted(values),
          total: values.length,
        });
      }
    });
    return map;
  }, [tfLinks, pfList, tfProgressMap]);

  // Sort TF links by Product Function
  const sortedTfLinks = useMemo(() => {
    return [...tfLinks].sort((a, b) => {
      const pfIdA = a.technicalFunction.productFunction?.id ?? "";
      const pfIdB = b.technicalFunction.productFunction?.id ?? "";
      const indexA = pfIds.indexOf(pfIdA);
      const indexB = pfIds.indexOf(pfIdB);
      if (indexA !== indexB) return indexA - indexB;
      return a.technicalFunction.id.localeCompare(b.technicalFunction.id);
    });
  }, [tfLinks, pfIds]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Context & Meta */}
      <div className="lg:col-span-4 space-y-4">
        {/* Title Section */}
        <div>
          <span className="id-mono mb-2 inline-block">{useCase.id}</span>
          <h1 className="text-lg font-semibold text-text-primary leading-tight">
            {useCase.name}
          </h1>
        </div>

        {/* Completion Status Card - Now reactive! */}
        <div className="card p-5">
          <h3 className="text-[10px] text-text-muted mb-4 font-mono uppercase tracking-wider">
            Completion Status
          </h3>
          <div className="mb-3 flex justify-between items-end">
            <span className={`text-3xl font-semibold tabular-nums transition-colors ${
              isComplete ? "text-success" : isActive ? "text-warning" : "text-text-muted"
            }`}>
              {percent}%
            </span>
            <span className="text-xs font-mono text-text-muted">{done}/{total}</span>
          </div>
          <div className="progress-track h-2">
            <div 
              className={`progress-fill transition-all duration-300 ${
                isComplete ? "progress-fill-success" : isActive ? "progress-fill-warning" : ""
              }`}
              style={{ 
                width: `${percent}%`,
                backgroundColor: !isComplete && !isActive ? 'var(--color-border)' : undefined 
              }}
            />
          </div>
        </div>

        {/* Description Card */}
        {useCase.description && (
          <div className="card p-5">
            <h3 className="text-[10px] text-text-muted mb-2 font-mono uppercase tracking-wider">
              Description
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {useCase.description}
            </p>
          </div>
        )}

        {/* Related Product Functions - Now reactive! */}
        {pfList.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] text-text-muted font-mono uppercase tracking-wider px-1">
              Related Product Functions
            </h3>
            {pfList.map((pf) => {
              const progress = pfProgressMap.get(pf.id) ?? { percent: 0, done: 0, total: 0 };
              const pfPercent = progress.percent;
              const pfComplete = pfPercent >= 100;
              const pfColor = pfColorMap.get(pf.id);
              
              return (
                <a 
                  key={pf.id}
                  href={`/structure?pf=${encodeURIComponent(pf.id)}`}
                  className={`rounded-lg border p-3.5 relative block group cursor-pointer transition-colors ${
                    pfComplete 
                      ? "bg-success-light/40 border-success/20 hover:border-success/40" 
                      : pfColor 
                        ? `${pfColor.bg} ${pfColor.border} hover:border-opacity-60` 
                        : "bg-bg-primary border-border hover:border-accent/30"
                  }`}
                >
                  <div 
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors ${
                      pfComplete ? "bg-success" : pfColor ? pfColor.bar : "bg-border"
                    }`} 
                  />
                  <div className="pl-2.5">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        pfComplete 
                          ? "bg-success/15 text-success" 
                          : pfColor 
                            ? pfColor.tag 
                            : "bg-bg-tertiary text-text-muted"
                      }`}>
                        {pf.id}
                      </span>
                      <span className={`text-xs font-mono font-medium transition-colors ${pfComplete ? "text-success" : "text-warning"}`}>
                        {pfPercent}%
                      </span>
                    </div>
                    <div className="text-sm text-text-primary font-medium mb-0.5 line-clamp-1 group-hover:text-accent transition-colors">
                      {pf.name}
                    </div>
                    <div className="text-[10px] text-text-muted truncate">
                      {pf.feature?.domain?.name} / {pf.feature?.name}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Technical Functions */}
      <div className="lg:col-span-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Technical Functions
          </h2>
          <span className="tag tag-muted">
            {tfLinks.length} linked
          </span>
        </div>

        <div className="space-y-1.5">
          {sortedTfLinks.map((link) => {
            const tf = link.technicalFunction;
            const pf = tf.productFunction;
            const tfPercent = tfProgressMap.get(tf.id) ?? 0;
            const isDone = tfPercent >= 100;
            const pfColor = pf ? pfColorMap.get(pf.id) : null;

            return (
              <div 
                key={tf.id} 
                className={`rounded-lg border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between relative transition-colors ${
                  isDone 
                    ? "bg-success-light/40 border-success/20" 
                    : pfColor 
                      ? `${pfColor.bg} ${pfColor.border}` 
                      : "bg-bg-primary border-border"
                }`}
              >
                {/* Color bar indicator */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors ${
                    isDone 
                      ? "bg-success" 
                      : pfColor 
                        ? pfColor.bar 
                        : "bg-border"
                  }`} 
                />
                
                <div className="flex-1 min-w-0 pl-2.5 pr-4 mb-2 sm:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                      isDone ? "bg-success/15 text-success" : "bg-bg-tertiary text-text-muted"
                    }`}>
                      {tf.id}
                    </span>
                    {pf && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        pfColor ? pfColor.tag : "bg-bg-tertiary text-text-muted"
                      }`}>
                        {pf.id}
                      </span>
                    )}
                  </div>
                  <div className={`text-sm font-medium line-clamp-1 transition-colors ${isDone ? "text-success" : "text-text-primary"}`}>
                    {tf.name}
                  </div>
                  {tf.description && (
                    <div className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                      {tf.description}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 pl-2.5 sm:pl-0">
                  <ProgressEditor 
                    tfId={tf.id} 
                    initialPercent={tfPercent}
                    onProgressChange={handleProgressChange}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {tfLinks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-sm text-text-muted">No Technical Functions linked.</div>
          </div>
        )}
      </div>
    </div>
  );
}
