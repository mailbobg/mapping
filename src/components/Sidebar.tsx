"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-full md:w-60 border-b md:border-r border-border bg-bg-primary p-5 flex-shrink-0 flex flex-col">
      {/* Logo Area */}
      <div className="mb-8 -ml-5">
        <Image
          src="/logo.png"
          alt="OCCluster"
          width={400}
          height={120}
          className="h-32 w-auto"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        <NavLink href="/" label="Dashboard" icon={<DashboardIcon />} active={isActive("/")} />
        <NavLink href="/use-cases" label="Use Cases" icon={<UseCaseIcon />} active={isActive("/use-cases")} />
        <NavLink href="/structure" label="Structure" icon={<StructureIcon />} active={isActive("/structure")} />
      </nav>

      {/* Status Footer */}
      <div className="mt-auto pt-5 border-t border-border">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Status</span>
            <span className="flex items-center gap-1.5">
              <span className="status-dot status-dot-success" />
              <span className="text-success font-medium">Online</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Version</span>
            <span className="font-mono text-text-secondary">v0.3.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`nav-link ${active ? "nav-link-active" : ""}`}
    >
      <span className={active ? "text-accent" : "text-text-muted"}>{icon}</span>
      {label}
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UseCaseIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function StructureIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

