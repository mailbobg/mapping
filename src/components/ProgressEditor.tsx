"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Props = {
  tfId: string;
  initialPercent: number;
  onProgressChange?: (tfId: string, newValue: number) => void;
};

export default function ProgressEditor({ tfId, initialPercent, onProgressChange }: Props) {
  const [value, setValue] = useState(initialPercent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSavedValue = useRef(initialPercent);
  const pendingValue = useRef<number | null>(null); // Track value to save
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isUserEditing = useRef(false); // Track if user is editing

  const saveValue = useCallback(async (newValue: number) => {
    if (newValue === lastSavedValue.current) {
      return;
    }
    
    setStatus("saving");
    try {
      const res = await fetch(`/api/technical-functions/${tfId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressPercent: newValue })
      });
      if (!res.ok) throw new Error("Failed");
      lastSavedValue.current = newValue;
      pendingValue.current = null;
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);
    } catch (err) {
      console.error(`[ProgressEditor] Save failed:`, err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [tfId]);

  // Auto-save with debounce - only save pendingValue
  useEffect(() => {
    if (pendingValue.current === null) return;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    const valueToSave = pendingValue.current;
    debounceTimer.current = setTimeout(() => {
      saveValue(valueToSave);
    }, 600); // 600ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, saveValue]);

  // Sync with initialPercent only if NOT from user editing
  useEffect(() => {
    if (!isUserEditing.current && initialPercent !== value) {
      setValue(initialPercent);
      lastSavedValue.current = initialPercent;
    }
  }, [initialPercent, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.min(100, Math.max(0, Number(e.target.value)));
    isUserEditing.current = true;
    pendingValue.current = newValue;
    setValue(newValue);
    // Notify parent immediately for UI updates
    onProgressChange?.(tfId, newValue);
    // Reset editing flag after a short delay
    setTimeout(() => {
      isUserEditing.current = false;
    }, 1000);
  };

  const isDone = value >= 100;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={handleChange}
          className={`w-[86px] h-7 border text-sm pl-2 pr-7 rounded-md focus:ring-2 focus:outline-none text-right font-mono tabular-nums transition-all ${
            isDone 
              ? "bg-success-light/60 border-success/25 text-success focus:border-success focus:ring-success/15" 
              : "bg-bg-secondary border-border text-text-primary focus:border-accent focus:ring-accent/15"
          }`}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-text-muted pointer-events-none">
          %
        </span>
      </div>

      {/* Status indicator */}
      <div className="w-5 h-5 flex items-center justify-center">
        {status === "saving" && (
          <span className="inline-block w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        )}
        {status === "saved" && (
          <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === "error" && (
          <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
    </div>
  );
}
