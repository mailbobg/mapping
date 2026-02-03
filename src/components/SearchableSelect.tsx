"use client";

import { useState, useRef, useEffect } from "react";

type Option = {
  value: string;
  label: string;
  group?: string;
};

function HighlightMatch({ text, search }: { text: string; search: string }) {
  if (!search.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 text-amber-900 px-0.5 rounded-sm">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SearchableSelect({ options, value, onChange, placeholder = "Select...", className = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Filter options based on search
  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.value.toLowerCase().includes(search.toLowerCase()) ||
    (o.group && o.group.toLowerCase().includes(search.toLowerCase()))
  );

  // Group filtered options
  const groupedOptions: Record<string, Option[]> = {};
  filteredOptions.forEach(o => {
    const group = o.group ?? "";
    if (!groupedOptions[group]) groupedOptions[group] = [];
    groupedOptions[group].push(o);
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-sm border border-border rounded-md px-3 py-1.5 bg-bg-primary hover:border-accent/50 focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none flex items-center justify-between gap-2 transition-colors"
      >
        <span className={selectedOption ? "text-text-primary" : "text-text-muted"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-bg-primary border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full text-sm border border-border rounded px-2 py-1.5 bg-bg-secondary focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none"
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-text-muted text-center">
                No results found
              </div>
            ) : (
              Object.entries(groupedOptions).map(([group, opts]) => (
                <div key={group}>
                  {group && (
                    <div className="px-3 py-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wider bg-bg-tertiary/50 sticky top-0">
                      {group}
                    </div>
                  )}
                  {opts.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors flex items-center gap-2 ${
                        option.value === value ? "bg-accent/5 text-accent" : "text-text-primary"
                      }`}
                    >
                      {option.value === value && (
                        <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className={option.value === value ? "" : "pl-5.5"}>
                        <HighlightMatch text={option.label} search={search} />
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
