"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import ProgressEditor from "@/components/ProgressEditor";
import SearchableSelect from "@/components/SearchableSelect";
import HighlightText from "@/components/HighlightText";
import { calcAverageProgress, countCompleted } from "@/lib/progress";

type TechnicalFunction = {
  id: string;
  name: string;
  description: string | null;
  state: string | null;
  progressPercent: number | null;
};

type Domain = {
  id: string;
  name: string;
};

type Feature = {
  id: string;
  name: string;
  domain: Domain | null;
};

type ProductFunction = {
  id: string;
  name: string;
  descriptionEn: string | null;
  tags: string[];
  feature: Feature | null;
  technicalFunctions: TechnicalFunction[];
};

type FeatureOption = {
  id: string;
  name: string;
  domain: { id: string; name: string } | null;
};

type PfOption = {
  id: string;
  name: string;
};

type Props = {
  data: ProductFunction[];
  highlightPfId?: string;
};

export default function StructureList({ data, highlightPfId }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED">("ALL");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [editingPfId, setEditingPfId] = useState<string | null>(null);
  const [editingTfId, setEditingTfId] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const [allPfs, setAllPfs] = useState<PfOption[]>([]);
  const [localData, setLocalData] = useState(data);
  const [saveStatus, setSaveStatus] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [singlePfMode, setSinglePfMode] = useState(!!highlightPfId);
  const [filteredPfId, setFilteredPfId] = useState<string | null>(highlightPfId ?? null);
  
  const ITEMS_PER_PAGE = 20;
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sync local data with props
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Initialize single PF mode and auto-expand when highlightPfId is provided
  useEffect(() => {
    if (highlightPfId) {
      setSinglePfMode(true);
      setFilteredPfId(highlightPfId);
      setExpandedIds(new Set([highlightPfId]));
    }
  }, [highlightPfId]);

  // Fetch features and PFs for dropdowns
  useEffect(() => {
    fetch("/api/features")
      .then(res => res.json())
      .then(setFeatures)
      .catch(console.error);
    
    fetch("/api/product-functions")
      .then(res => res.json())
      .then(setAllPfs)
      .catch(console.error);
  }, []);


  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const toggleAll = (expand: boolean) => {
    if (expand) {
      setExpandedIds(new Set(filteredData.map(d => d.id)));
    } else {
      setExpandedIds(new Set());
    }
  };

  // Update PF feature
  const handleFeatureChange = useCallback(async (pfId: string, featureId: string) => {
    setSaveStatus(prev => ({ ...prev, [pfId]: "saving" }));
    try {
      const res = await fetch(`/api/product-functions/${pfId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureId })
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      
      setLocalData(prev => prev.map(pf => 
        pf.id === pfId ? { ...pf, feature: updated.feature } : pf
      ));
      setSaveStatus(prev => ({ ...prev, [pfId]: "saved" }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [pfId]: undefined as any })), 1500);
    } catch {
      setSaveStatus(prev => ({ ...prev, [pfId]: "error" }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [pfId]: undefined as any })), 2000);
    }
  }, []);

  // Update PF tags
  const handleTagsChange = useCallback(async (pfId: string, tags: string[]) => {
    setSaveStatus(prev => ({ ...prev, [pfId]: "saving" }));
    try {
      const res = await fetch(`/api/product-functions/${pfId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags })
      });
      if (!res.ok) throw new Error("Failed");
      
      setLocalData(prev => prev.map(pf => 
        pf.id === pfId ? { ...pf, tags } : pf
      ));
      setSaveStatus(prev => ({ ...prev, [pfId]: "saved" }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [pfId]: undefined as any })), 1500);
    } catch {
      setSaveStatus(prev => ({ ...prev, [pfId]: "error" }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [pfId]: undefined as any })), 2000);
    }
  }, []);

  // Handle TF progress change - update local state for immediate UI feedback
  const handleTfProgressChange = useCallback((tfId: string, newValue: number) => {
    setLocalData(prev => prev.map(pf => ({
      ...pf,
      technicalFunctions: pf.technicalFunctions.map(tf =>
        tf.id === tfId ? { ...tf, progressPercent: newValue } : tf
      )
    })));
  }, []);

  // Update TF parent PF
  const handleTfParentChange = useCallback(async (tfId: string, newPfId: string, currentPfId: string) => {
    const key = `tf-${tfId}`;
    setSaveStatus(prev => ({ ...prev, [key]: "saving" }));
    try {
      const res = await fetch(`/api/technical-functions/${tfId}/parent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productFunctionId: newPfId })
      });
      if (!res.ok) throw new Error("Failed");
      
      // Move TF from old PF to new PF in local state
      setLocalData(prev => {
        const tf = prev.find(pf => pf.id === currentPfId)?.technicalFunctions.find(t => t.id === tfId);
        if (!tf) return prev;
        
        return prev.map(pf => {
          if (pf.id === currentPfId) {
            return { ...pf, technicalFunctions: pf.technicalFunctions.filter(t => t.id !== tfId) };
          }
          if (pf.id === newPfId) {
            return { ...pf, technicalFunctions: [...pf.technicalFunctions, tf] };
          }
          return pf;
        });
      });
      
      setSaveStatus(prev => ({ ...prev, [key]: "saved" }));
      setEditingTfId(null);
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [key]: undefined as any })), 1500);
    } catch {
      setSaveStatus(prev => ({ ...prev, [key]: "error" }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [key]: undefined as any })), 2000);
    }
  }, []);

  const filteredData = useMemo(() => {
    return localData.filter((pf) => {
      // Single PF mode filter
      if (singlePfMode && filteredPfId && pf.id !== filteredPfId) {
        return false;
      }

      const tfValues = pf.technicalFunctions.map(tf => tf.progressPercent ?? 0);
      const percent = calcAverageProgress(tfValues);
      
      let statusMatch = true;
      if (filterStatus === "COMPLETED") statusMatch = percent === 100;
      else if (filterStatus === "NOT_STARTED") statusMatch = percent === 0;
      else if (filterStatus === "IN_PROGRESS") statusMatch = percent > 0 && percent < 100;

      if (!statusMatch) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      
      const matchName = pf.name.toLowerCase().includes(q);
      const matchId = pf.id.toLowerCase().includes(q);
      const matchDescription = pf.descriptionEn?.toLowerCase().includes(q);
      const matchFeature = pf.feature?.name.toLowerCase().includes(q);
      const matchDomain = pf.feature?.domain?.name.toLowerCase().includes(q);
      const matchTags = pf.tags?.some(tag => tag.toLowerCase().includes(q));
      
      const matchTf = pf.technicalFunctions.some(tf => 
        tf.name.toLowerCase().includes(q) || 
        tf.id.toLowerCase().includes(q) ||
        (tf.description && tf.description.toLowerCase().includes(q))
      );

      return matchName || matchId || matchDescription || matchFeature || matchDomain || matchTags || matchTf;
    });
  }, [localData, searchQuery, filterStatus, singlePfMode, filteredPfId]);

  const paginatedData = useMemo(() => {
    return filteredData.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredData, page]);

  const hasMore = paginatedData.length < filteredData.length;

  // Get the filtered PF name for display
  const filteredPfName = singlePfMode && filteredPfId 
    ? localData.find(pf => pf.id === filteredPfId)?.name 
    : null;

  // Handle show all click
  const handleShowAll = () => {
    setSinglePfMode(false);
    setFilteredPfId(null);
    // Update URL to remove the pf parameter
    window.history.replaceState({}, '', '/structure');
  };

  return (
    <div className="space-y-4">
      {/* Single PF Mode Banner */}
      {singlePfMode && filteredPfId && (
        <div className="card p-4 bg-accent/5 border-accent/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-text-muted">Viewing single Product Function</div>
              <div className="text-sm font-medium text-text-primary">
                <span className="text-accent font-mono mr-2">{filteredPfId}</span>
                {filteredPfName}
              </div>
            </div>
          </div>
          <button
            onClick={handleShowAll}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Show All
          </button>
        </div>
      )}

      {/* Controls Header */}
      <div className="card p-4 space-y-4 sticky top-0 z-20 bg-bg-primary/98 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search functions, domains, tags..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="search-input"
              disabled={singlePfMode}
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1.5">
            {(["ALL", "IN_PROGRESS", "COMPLETED", "NOT_STARTED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => { setFilterStatus(status); setPage(1); }}
                className={`filter-btn ${filterStatus === status ? "filter-btn-active" : ""}`}
                disabled={singlePfMode}
              >
                {status === "ALL" ? "All" : status === "IN_PROGRESS" ? "Active" : status === "COMPLETED" ? "Done" : "Pending"}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Actions & Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-text-muted">
            <span className="font-mono">{paginatedData.length}</span> of <span className="font-mono">{filteredData.length}</span> items
            {singlePfMode && <span className="ml-2 text-accent">(filtered)</span>}
          </div>
          <div className="flex gap-4">
            <button onClick={() => toggleAll(true)} className="text-text-muted hover:text-accent transition-colors">
              Expand All
            </button>
            <button onClick={() => toggleAll(false)} className="text-text-muted hover:text-accent transition-colors">
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {paginatedData.map((pf) => {
          const tfValues = pf.technicalFunctions.map(tf => tf.progressPercent ?? 0);
          const done = countCompleted(tfValues);
          const total = tfValues.length;
          const percent = calcAverageProgress(tfValues);
          const isComplete = percent === 100;
          const isExpanded = expandedIds.has(pf.id);
          const isHighlighted = highlightedId === pf.id;
          const isEditing = editingPfId === pf.id;
          const pfSaveStatus = saveStatus[pf.id];

          return (
            <div 
              key={pf.id}
              ref={(el) => { if (el) itemRefs.current.set(pf.id, el); }}
              className={`hierarchy-item transition-all duration-500 ${isExpanded ? "hierarchy-item-expanded" : ""} ${isHighlighted ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-primary" : ""}`}
            >
              {/* Level Indicator */}
              <div className={`level-bar ${isComplete ? "level-bar-complete" : percent > 0 ? "level-bar-progress" : "level-bar-pending"}`} />
              
              {/* Header */}
              <div className="pl-5 pr-4 py-3.5 flex items-center justify-between group">
                <div 
                  className="flex-1 min-w-0 pr-4 cursor-pointer"
                  onClick={() => toggleExpand(pf.id)}
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <HighlightText text={pf.id} highlight={searchQuery} className="id-mono" />
                    {!isEditing && pf.feature?.domain?.name && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                        <HighlightText text={pf.feature.domain.name} highlight={searchQuery} />
                      </span>
                    )}
                    {!isEditing && pf.feature?.name && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">
                        <HighlightText text={pf.feature.name} highlight={searchQuery} />
                      </span>
                    )}
                    {/* Save status indicator */}
                    {pfSaveStatus === "saving" && (
                      <span className="inline-block w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    )}
                    {pfSaveStatus === "saved" && (
                      <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                    <HighlightText text={pf.name} highlight={searchQuery} />
                  </h3>
                  {pf.descriptionEn && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                      <HighlightText text={pf.descriptionEn} highlight={searchQuery} />
                    </p>
                  )}
                  {!isEditing && pf.tags && pf.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {pf.tags.slice(0, 6).map((tag, idx) => (
                        <span 
                          key={idx}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                        >
                          <HighlightText text={tag} highlight={searchQuery} />
                        </span>
                      ))}
                      {pf.tags.length > 6 && (
                        <span className="text-[9px] text-text-muted">+{pf.tags.length - 6}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Edit Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingPfId(isEditing ? null : pf.id); }}
                    className={`p-1.5 rounded transition-colors ${isEditing ? "bg-accent text-white" : "text-text-muted hover:text-accent hover:bg-bg-tertiary"}`}
                    title={isEditing ? "Close edit" : "Edit"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  {/* Progress Stats */}
                  <div className="text-right min-w-[60px]">
                    <div className={`text-base font-semibold tabular-nums whitespace-nowrap ${isComplete ? "text-success" : percent > 0 ? "text-warning" : "text-text-muted"}`}>
                      {percent}%
                    </div>
                    <div className="text-[10px] font-mono text-text-muted whitespace-nowrap">{done}/{total}</div>
                  </div>

                  {/* Expand Icon */}
                  <button
                    onClick={() => toggleExpand(pf.id)}
                    className={`text-text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Edit Panel */}
              {isEditing && (
                <div className="px-5 py-3 bg-accent/5 border-t border-accent/20 space-y-3">
                  {/* Feature Selector */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-text-muted w-20 flex-shrink-0">Feature:</label>
                    <SearchableSelect
                      value={pf.feature?.id ?? ""}
                      onChange={(value) => handleFeatureChange(pf.id, value)}
                      placeholder="Select Feature..."
                      className="flex-1"
                      options={features.map(f => ({
                        value: f.id,
                        label: f.name,
                        group: f.domain?.name ?? "No Domain"
                      }))}
                    />
                  </div>

                  {/* Tags Editor */}
                  <div className="flex items-start gap-3">
                    <label className="text-xs text-text-muted w-20 pt-1.5">Tags:</label>
                    <div className="flex-1">
                      <input
                        type="text"
                        defaultValue={pf.tags?.join(", ") ?? ""}
                        onBlur={(e) => {
                          const newTags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                          if (JSON.stringify(newTags) !== JSON.stringify(pf.tags)) {
                            handleTagsChange(pf.id, newTags);
                          }
                        }}
                        placeholder="Enter tags separated by commas..."
                        className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-bg-primary focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none"
                      />
                      <p className="text-[10px] text-text-muted mt-1">Comma-separated. Press Tab or click outside to save.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className="pl-5 pr-4 pb-4 pt-2 bg-bg-tertiary/30 border-t border-border">
                  {pf.technicalFunctions.length === 0 ? (
                    <div className="text-xs text-text-muted italic py-6 text-center">
                      No Technical Functions mapped.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {pf.technicalFunctions.map((tf) => {
                        const tfPercent = tf.progressPercent ?? 0;
                        const isDone = tfPercent >= 100;
                        const isTfEditing = editingTfId === tf.id;
                        const tfSaveStatus = saveStatus[`tf-${tf.id}`];
                        
                        return (
                          <div 
                            key={tf.id} 
                            className={`flex flex-col p-3 rounded-lg border transition-colors ${
                              isDone 
                                ? "bg-success-light/50 border-success/15" 
                                : "bg-bg-primary border-border hover:border-accent/20"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                              <div className="flex-1 pr-4 min-w-0 mb-2 sm:mb-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                                    isDone ? "bg-success/15 text-success" : "bg-bg-tertiary text-text-muted"
                                  }`}>
                                    <HighlightText text={tf.id} highlight={searchQuery} />
                                  </span>
                                  {tf.state && (
                                    <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                      {tf.state}
                                    </span>
                                  )}
                                  {/* TF Save status */}
                                  {tfSaveStatus === "saving" && (
                                    <span className="inline-block w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                                  )}
                                  {tfSaveStatus === "saved" && (
                                    <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div className={`text-sm ${isDone ? "text-success" : "text-text-primary"}`}>
                                  <HighlightText text={tf.name} highlight={searchQuery} />
                                </div>
                                {tf.description && (
                                  <div className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                                    <HighlightText text={tf.description} highlight={searchQuery} />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Move TF Button */}
                                <button
                                  onClick={() => setEditingTfId(isTfEditing ? null : tf.id)}
                                  className={`p-1 rounded text-[10px] transition-colors ${isTfEditing ? "bg-accent text-white" : "text-text-muted hover:text-accent hover:bg-bg-tertiary"}`}
                                  title="Move to another PF"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                </button>
                                <ProgressEditor 
                                  tfId={tf.id} 
                                  initialPercent={tf.progressPercent ?? 0}
                                  onProgressChange={handleTfProgressChange}
                                />
                              </div>
                            </div>
                            
                            {/* TF Parent Selector */}
                            {isTfEditing && (
                              <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2">
                                <label className="text-[10px] text-text-muted flex-shrink-0">Move to:</label>
                                <SearchableSelect
                                  value={pf.id}
                                  onChange={(value) => {
                                    if (value !== pf.id) {
                                      handleTfParentChange(tf.id, value, pf.id);
                                    }
                                  }}
                                  placeholder="Select Product Function..."
                                  className="flex-1"
                                  options={allPfs.map(p => ({
                                    value: p.id,
                                    label: `${p.id} - ${p.name}`
                                  }))}
                                />
                                <button
                                  onClick={() => setEditingTfId(null)}
                                  className="text-[10px] text-text-muted hover:text-text-primary px-2"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Load More */}
        {hasMore && (
          <div className="text-center pt-4">
            <button 
              onClick={() => setPage(p => p + 1)}
              className="filter-btn hover:filter-btn-active px-6 py-2"
            >
              Load More
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-sm text-text-secondary mb-1">No matches found</div>
            <p className="text-xs text-text-muted">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
