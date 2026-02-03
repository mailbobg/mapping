"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

type UseCase = {
  id: string;
  name: string;
};

type Props = {
  currentId: string;
  currentIndex: number;
  totalCount: number;
  prevUseCase: UseCase | null;
  nextUseCase: UseCase | null;
  allUseCases: UseCase[];
};

export default function UseCaseNavigator({
  currentId,
  currentIndex,
  totalCount,
  prevUseCase,
  nextUseCase,
  allUseCases,
}: Props) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused (except our search input)
      if (document.activeElement?.tagName === "INPUT" && document.activeElement !== inputRef.current) {
        return;
      }

      if (e.key === "ArrowLeft" && prevUseCase) {
        router.push(`/use-cases/${prevUseCase.id}`);
      } else if (e.key === "ArrowRight" && nextUseCase) {
        router.push(`/use-cases/${nextUseCase.id}`);
      } else if (e.key === "Escape" && showDropdown) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevUseCase, nextUseCase, router, showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter use cases based on search
  const filteredUseCases = allUseCases.filter(
    (uc) =>
      uc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id: string) => {
    setShowDropdown(false);
    setSearchQuery("");
    router.push(`/use-cases/${id}`);
  };

  return (
    <div className="flex items-center justify-between border-b border-border pb-4">
      {/* Back to List */}
      <a 
        href="/use-cases" 
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Back to List</span>
      </a>

      {/* Center: Position Indicator with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            setShowDropdown(!showDropdown);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors group"
        >
          <span className="text-xs text-text-muted">
            <span className="font-mono font-medium text-text-primary">{currentIndex + 1}</span>
            <span className="mx-1">/</span>
            <span className="font-mono">{totalCount}</span>
          </span>
          <svg 
            className={`w-3.5 h-3.5 text-text-muted transition-transform ${showDropdown ? "rotate-180" : ""}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 max-h-96 bg-bg-primary border border-border rounded-lg shadow-lg overflow-hidden z-50">
            {/* Search Input */}
            <div className="p-2 border-b border-border">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border rounded-md focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
              />
            </div>

            {/* Use Case List */}
            <div className="max-h-72 overflow-y-auto">
              {filteredUseCases.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  No matches found
                </div>
              ) : (
                filteredUseCases.map((uc, idx) => {
                  const isActive = uc.id === currentId;
                  return (
                    <button
                      key={uc.id}
                      onClick={() => handleSelect(uc.id)}
                      className={`w-full text-left px-3 py-2.5 border-b border-border/50 last:border-0 transition-colors ${
                        isActive
                          ? "bg-accent-light"
                          : "hover:bg-bg-tertiary"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          isActive ? "bg-accent/15 text-accent" : "bg-bg-tertiary text-text-muted"
                        }`}>
                          {uc.id}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                          #{allUseCases.findIndex(u => u.id === uc.id) + 1}
                        </span>
                      </div>
                      <div className={`text-sm line-clamp-1 ${isActive ? "text-accent font-medium" : "text-text-primary"}`}>
                        {uc.name}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => prevUseCase && router.push(`/use-cases/${prevUseCase.id}`)}
          disabled={!prevUseCase}
          className={`p-2 rounded-lg transition-colors ${
            prevUseCase
              ? "hover:bg-bg-tertiary text-text-secondary hover:text-accent"
              : "text-border cursor-not-allowed"
          }`}
          title={prevUseCase ? `Previous: ${prevUseCase.id}` : "No previous item"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => nextUseCase && router.push(`/use-cases/${nextUseCase.id}`)}
          disabled={!nextUseCase}
          className={`p-2 rounded-lg transition-colors ${
            nextUseCase
              ? "hover:bg-bg-tertiary text-text-secondary hover:text-accent"
              : "text-border cursor-not-allowed"
          }`}
          title={nextUseCase ? `Next: ${nextUseCase.id}` : "No next item"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
