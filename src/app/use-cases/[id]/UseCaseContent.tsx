"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import ProgressEditor from "@/components/ProgressEditor";
import { calcAverageProgress, countCompleted } from "@/lib/progress";
import { useRouter } from "next/navigation";

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

type AvailableTF = {
  id: string;
  name: string;
  description: string | null;
  progressPercent: number | null;
  productFunction: {
    id: string;
    name: string;
    feature: {
      name: string;
      domain: { name: string } | null;
    } | null;
  } | null;
};

export default function UseCaseContent({ useCase, tfLinks: initialTfLinks, pfList: initialPfList, pfIds: initialPfIds }: Props) {
  const router = useRouter();
  
  // Local state for TF links (to support add/remove without page refresh)
  const [localTfLinks, setLocalTfLinks] = useState<TfLink[]>(initialTfLinks);
  const [localPfIds, setLocalPfIds] = useState<string[]>(initialPfIds);
  
  // Modal state for adding TFs
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableTFs, setAvailableTFs] = useState<AvailableTF[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [tfSearch, setTfSearch] = useState("");
  const [addingTfId, setAddingTfId] = useState<string | null>(null);
  const [removingTfId, setRemovingTfId] = useState<string | null>(null);
  
  // Track TF progress values in client state
  const [tfProgressMap, setTfProgressMap] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    localTfLinks.forEach((link) => {
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

  // Fetch available TFs when modal opens
  const fetchAvailableTFs = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const res = await fetch(`/api/use-cases/${useCase.id}/available-technical-functions`);
      if (res.ok) {
        const data = await res.json();
        setAvailableTFs(data);
      }
    } catch (error) {
      console.error("Failed to fetch available TFs:", error);
    } finally {
      setLoadingAvailable(false);
    }
  }, [useCase.id]);

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableTFs();
    }
  }, [showAddModal, fetchAvailableTFs]);

  // Add TF to Use Case
  const handleAddTF = async (tfId: string) => {
    setAddingTfId(tfId);
    try {
      const res = await fetch(`/api/use-cases/${useCase.id}/technical-functions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicalFunctionId: tfId })
      });
      
      if (res.ok) {
        const addedTF = await res.json();
        // Update local state
        const newLink: TfLink = {
          technicalFunction: {
            id: addedTF.id,
            name: addedTF.name,
            description: addedTF.description || null,
            progressPercent: addedTF.progressPercent,
            productFunction: addedTF.productFunction
          }
        };
        setLocalTfLinks(prev => [...prev, newLink]);
        setTfProgressMap(prev => {
          const newMap = new Map(prev);
          newMap.set(addedTF.id, addedTF.progressPercent ?? 0);
          return newMap;
        });
        
        // Update PF IDs if new PF
        if (addedTF.productFunction && !localPfIds.includes(addedTF.productFunction.id)) {
          setLocalPfIds(prev => [...prev, addedTF.productFunction.id].sort());
        }
        
        // Remove from available list
        setAvailableTFs(prev => prev.filter(tf => tf.id !== tfId));
      }
    } catch (error) {
      console.error("Failed to add TF:", error);
    } finally {
      setAddingTfId(null);
    }
  };

  // Remove TF from Use Case
  const handleRemoveTF = async (tfId: string) => {
    if (!confirm("确定要移除这个 Technical Function 吗？")) return;
    
    setRemovingTfId(tfId);
    try {
      const res = await fetch(`/api/use-cases/${useCase.id}/technical-functions/${tfId}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        // Update local state
        setLocalTfLinks(prev => prev.filter(link => link.technicalFunction.id !== tfId));
        setTfProgressMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(tfId);
          return newMap;
        });
        
        // Recalculate PF IDs
        const remainingPfIds = new Set<string>();
        localTfLinks
          .filter(link => link.technicalFunction.id !== tfId)
          .forEach(link => {
            if (link.technicalFunction.productFunction?.id) {
              remainingPfIds.add(link.technicalFunction.productFunction.id);
            }
          });
        setLocalPfIds(Array.from(remainingPfIds).sort());
      }
    } catch (error) {
      console.error("Failed to remove TF:", error);
    } finally {
      setRemovingTfId(null);
    }
  };

  // Filter available TFs by search
  const filteredAvailableTFs = useMemo(() => {
    if (!tfSearch.trim()) return availableTFs;
    const searchLower = tfSearch.toLowerCase();
    return availableTFs.filter(tf => 
      tf.id.toLowerCase().includes(searchLower) ||
      tf.name.toLowerCase().includes(searchLower) ||
      tf.productFunction?.name.toLowerCase().includes(searchLower) ||
      tf.productFunction?.id.toLowerCase().includes(searchLower)
    );
  }, [availableTFs, tfSearch]);

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
    localPfIds.forEach((pfId, index) => {
      map.set(pfId, PF_COLORS[index % PF_COLORS.length]);
    });
    return map;
  }, [localPfIds]);

  // Get unique PFs from current TF links
  const currentPfList = useMemo(() => {
    const pfMap = new Map<string, ProductFunction>();
    localTfLinks.forEach(link => {
      const pf = link.technicalFunction.productFunction;
      if (pf && !pfMap.has(pf.id)) {
        // Find full PF info from initialPfList or create minimal
        const fullPf = initialPfList.find(p => p.id === pf.id);
        if (fullPf) {
          pfMap.set(pf.id, fullPf);
        }
      }
    });
    return Array.from(pfMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [localTfLinks, initialPfList]);

  // Calculate PF progress from current TF state
  const pfProgressMap = useMemo(() => {
    const map = new Map<string, { percent: number; done: number; total: number }>();
    currentPfList.forEach((pf) => {
      const tfIdsInPf = localTfLinks
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
  }, [localTfLinks, currentPfList, tfProgressMap]);

  // Sort TF links by Product Function
  const sortedTfLinks = useMemo(() => {
    return [...localTfLinks].sort((a, b) => {
      const pfIdA = a.technicalFunction.productFunction?.id ?? "";
      const pfIdB = b.technicalFunction.productFunction?.id ?? "";
      const indexA = localPfIds.indexOf(pfIdA);
      const indexB = localPfIds.indexOf(pfIdB);
      if (indexA !== indexB) return indexA - indexB;
      return a.technicalFunction.id.localeCompare(b.technicalFunction.id);
    });
  }, [localTfLinks, localPfIds]);

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
        {currentPfList.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] text-text-muted font-mono uppercase tracking-wider px-1">
              Related Product Functions
            </h3>
            {currentPfList.map((pf) => {
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
          <div className="flex items-center gap-2">
            <span className="tag tag-muted">
              {localTfLinks.length} linked
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              添加
            </button>
          </div>
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

                <div className="flex-shrink-0 pl-2.5 sm:pl-0 flex items-center gap-2">
                  <ProgressEditor 
                    tfId={tf.id} 
                    initialPercent={tfPercent}
                    onProgressChange={handleProgressChange}
                  />
                  <button
                    onClick={() => handleRemoveTF(tf.id)}
                    disabled={removingTfId === tf.id}
                    className="p-1.5 rounded hover:bg-danger-light text-text-muted hover:text-danger transition-colors disabled:opacity-50"
                    title="移除"
                  >
                    {removingTfId === tf.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {localTfLinks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-sm text-text-muted mb-3">No Technical Functions linked.</div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs"
            >
              添加 Technical Function
            </button>
          </div>
        )}
      </div>

      {/* Add TF Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                添加 Technical Function
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setTfSearch("");
                }}
                className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border">
              <input
                type="text"
                value={tfSearch}
                onChange={(e) => setTfSearch(e.target.value)}
                placeholder="搜索 ID、名称或 Product Function..."
                className="search-input"
                autoFocus
              />
            </div>

            {/* TF List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingAvailable ? (
                <div className="text-center py-8 text-text-muted">
                  <svg className="w-6 h-6 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  加载中...
                </div>
              ) : filteredAvailableTFs.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  {tfSearch ? "没有匹配的 Technical Function" : "没有可添加的 Technical Function"}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredAvailableTFs.map((tf) => (
                    <div
                      key={tf.id}
                      className="border border-border rounded-lg p-3 flex items-center justify-between hover:border-accent/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">
                            {tf.id}
                          </span>
                          {tf.productFunction && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-light text-accent font-medium">
                              {tf.productFunction.id}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-text-primary line-clamp-1">
                          {tf.name}
                        </div>
                        {tf.productFunction && (
                          <div className="text-[10px] text-text-muted mt-0.5 truncate">
                            {tf.productFunction.feature?.domain?.name} / {tf.productFunction.feature?.name} / {tf.productFunction.name}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddTF(tf.id)}
                        disabled={addingTfId === tf.id}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
                      >
                        {addingTfId === tf.id ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            添加中
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            添加
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-between items-center">
              <span className="text-xs text-text-muted">
                {filteredAvailableTFs.length} 个可添加
              </span>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setTfSearch("");
                }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
