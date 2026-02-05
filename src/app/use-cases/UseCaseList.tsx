"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import HighlightText from "@/components/HighlightText";

type UseCase = {
  id: string;
  name: string;
  description: string | null;
  total: number;
  done: number;
  percent: number;
};

type Props = {
  data: UseCase[];
};

export default function UseCaseList({ data }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED">("ALL");
  const [page, setPage] = useState(1);
  const [directJumpId, setDirectJumpId] = useState("");
  const [showJumpResults, setShowJumpResults] = useState(false);
  const jumpInputRef = useRef<HTMLInputElement>(null);
  const jumpResultsRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 30;

  // Close jump results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        jumpResultsRef.current && 
        !jumpResultsRef.current.contains(e.target as Node) &&
        jumpInputRef.current &&
        !jumpInputRef.current.contains(e.target as Node)
      ) {
        setShowJumpResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter data based on search and status
  const filteredData = useMemo(() => {
    return data.filter((uc) => {
      // Status filter
      let statusMatch = true;
      if (filterStatus === "COMPLETED") statusMatch = uc.percent === 100;
      else if (filterStatus === "NOT_STARTED") statusMatch = uc.percent === 0;
      else if (filterStatus === "IN_PROGRESS") statusMatch = uc.percent > 0 && uc.percent < 100;

      if (!statusMatch) return false;

      // Search filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        uc.id.toLowerCase().includes(q) ||
        uc.name.toLowerCase().includes(q) ||
        (uc.description && uc.description.toLowerCase().includes(q))
      );
    });
  }, [data, searchQuery, filterStatus]);

  // Paginated data
  const paginatedData = useMemo(() => {
    return filteredData.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredData, page]);

  const hasMore = paginatedData.length < filteredData.length;

  // Direct jump results
  const jumpResults = useMemo(() => {
    if (!directJumpId) return [];
    const q = directJumpId.toLowerCase();
    return data
      .filter((uc) => uc.id.toLowerCase().includes(q) || uc.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [data, directJumpId]);

  // Handle direct jump
  const handleDirectJump = (id: string) => {
    setShowJumpResults(false);
    setDirectJumpId("");
    router.push(`/use-cases/${id}`);
  };

  // Handle Enter key in direct jump input
  const handleJumpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && jumpResults.length > 0) {
      handleDirectJump(jumpResults[0].id);
    } else if (e.key === "Escape") {
      setShowJumpResults(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const completed = data.filter((uc) => uc.percent === 100).length;
    const inProgress = data.filter((uc) => uc.percent > 0 && uc.percent < 100).length;
    const notStarted = data.filter((uc) => uc.percent === 0).length;
    return { completed, inProgress, notStarted };
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="card p-4 space-y-4 sticky top-0 z-20 bg-bg-primary/98 backdrop-blur-sm">
        {/* Row 1: Direct Jump & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Direct Jump Input */}
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <input
              ref={jumpInputRef}
              type="text"
              placeholder="Go to ID..."
              value={directJumpId}
              onChange={(e) => {
                setDirectJumpId(e.target.value);
                setShowJumpResults(true);
              }}
              onFocus={() => directJumpId && setShowJumpResults(true)}
              onKeyDown={handleJumpKeyDown}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-accent-light border border-accent/20 rounded-lg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 placeholder:text-accent/50 text-accent font-medium"
            />
            
            {/* Jump Results Dropdown */}
            {showJumpResults && jumpResults.length > 0 && (
              <div 
                ref={jumpResultsRef}
                className="absolute top-full mt-1 left-0 w-72 max-h-64 bg-bg-primary border border-border rounded-lg shadow-lg overflow-hidden z-50"
              >
                {jumpResults.map((uc) => (
                  <button
                    key={uc.id}
                    onClick={() => handleDirectJump(uc.id)}
                    className="w-full text-left px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <HighlightText text={uc.id} highlight={directJumpId} className="id-mono text-[10px]" />
                      <span className={`text-[10px] font-mono ${
                        uc.percent === 100 ? "text-success" : uc.percent > 0 ? "text-warning" : "text-text-muted"
                      }`}>
                        {uc.percent}%
                      </span>
                    </div>
                    <div className="text-sm text-text-primary line-clamp-1">
                      <HighlightText text={uc.name} highlight={directJumpId} />
                    </div>
                  </button>
                ))}
                <div className="px-3 py-2 bg-bg-tertiary text-[10px] text-text-muted">
                  Press Enter to go to first result
                </div>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Filter by ID, name, or description..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setPage(1); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Filters & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Status Filters */}
          <div className="flex gap-1.5">
            <button
              onClick={() => { setFilterStatus("ALL"); setPage(1); }}
              className={`filter-btn ${filterStatus === "ALL" ? "filter-btn-active" : ""}`}
            >
              All
            </button>
            <button
              onClick={() => { setFilterStatus("IN_PROGRESS"); setPage(1); }}
              className={`filter-btn ${filterStatus === "IN_PROGRESS" ? "filter-btn-active" : ""}`}
            >
              <span className="status-dot status-dot-warning mr-1.5" />
              Active ({stats.inProgress})
            </button>
            <button
              onClick={() => { setFilterStatus("COMPLETED"); setPage(1); }}
              className={`filter-btn ${filterStatus === "COMPLETED" ? "filter-btn-active" : ""}`}
            >
              <span className="status-dot status-dot-success mr-1.5" />
              Done ({stats.completed})
            </button>
            <button
              onClick={() => { setFilterStatus("NOT_STARTED"); setPage(1); }}
              className={`filter-btn ${filterStatus === "NOT_STARTED" ? "filter-btn-active" : ""}`}
            >
              <span className="status-dot status-dot-muted mr-1.5" />
              Pending ({stats.notStarted})
            </button>
          </div>

          {/* Results Count */}
          <div className="text-xs text-text-muted">
            <span className="font-mono">{paginatedData.length}</span> of <span className="font-mono">{filteredData.length}</span> shown
          </div>
        </div>
      </div>

      {/* Use Case Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {paginatedData.map((uc) => {
          const isComplete = uc.percent === 100;
          const isActive = uc.percent > 0 && uc.percent < 100;

          return (
            <a 
              key={uc.id} 
              href={`/use-cases/${uc.id}`}
              className="hierarchy-item p-4 block group relative"
            >
              {/* Level Bar */}
              <div 
                className={`level-bar ${
                  isComplete ? "level-bar-complete" : isActive ? "level-bar-progress" : "level-bar-pending"
                }`} 
              />

              <div className="pl-3">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-3">
                  <HighlightText text={uc.id} highlight={searchQuery} className="id-mono" />
                  {isComplete && (
                    <span className="tag text-[10px] bg-success-light text-success px-2 py-0.5">
                      Complete
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-text-primary mb-4 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                  <HighlightText text={uc.name} highlight={searchQuery} />
                </h3>

                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-text-muted">Progress</span>
                    <span className={`text-base font-semibold font-mono tabular-nums ${
                      isComplete ? "text-success" : isActive ? "text-warning" : "text-text-muted"
                    }`}>
                      {uc.percent}%
                    </span>
                  </div>
                  
                  <div className="progress-track h-2">
                    <div 
                      className={`progress-fill ${
                        isComplete ? "progress-fill-success" : isActive ? "progress-fill-warning" : ""
                      }`}
                      style={{ 
                        width: `${uc.percent}%`,
                        backgroundColor: !isComplete && !isActive ? 'var(--color-border)' : undefined 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span>{uc.total} functions</span>
                    <span>{uc.done} done</span>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-4">
          <button 
            onClick={() => setPage(p => p + 1)}
            className="filter-btn hover:filter-btn-active px-6 py-2"
          >
            Load More ({filteredData.length - paginatedData.length} remaining)
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
  );
}
