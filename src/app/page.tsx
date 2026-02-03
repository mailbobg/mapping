import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

// Cache dashboard stats for 30 seconds
const getDashboardStats = unstable_cache(
  async () => {
    const [useCaseCount, tfCount, pfCount, completedTfCount] = await Promise.all([
      prisma.useCase.count(),
      prisma.technicalFunction.count(),
      prisma.productFunction.count(),
      prisma.technicalFunction.count({
        where: { progressPercent: { gte: 100 } }
      })
    ]);
    
    return { useCaseCount, tfCount, pfCount, completedTfCount };
  },
  ["dashboard-stats"],
  { revalidate: 30 }
);

export default async function DashboardPage() {
  let stats = { useCaseCount: 0, tfCount: 0, pfCount: 0, completedTfCount: 0 };
  let isOffline = false;

  try {
    stats = await getDashboardStats();
  } catch (error) {
    console.error("Database connection failed:", error);
    isOffline = true;
  }

  const { useCaseCount, tfCount, pfCount, completedTfCount } = stats;
  const overallProgress = tfCount > 0 ? Math.round((completedTfCount / tfCount) * 100) : 0;
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="page-header">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">System overview and quick actions</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="status-dot status-dot-success" />
            <span className="text-sm text-text-secondary">System Active</span>
          </div>
        </div>
      </header>

      {/* Offline Alert */}
      {isOffline && (
        <div className="bg-danger-light border border-danger/20 p-4 rounded-lg flex items-center gap-3">
          <span className="status-dot status-dot-muted animate-pulse" style={{ backgroundColor: 'var(--color-danger)' }} />
          <div className="text-sm">
            <span className="font-medium text-danger">Connection Error:</span>
            <span className="text-text-secondary ml-1">Database connection lost. Displaying offline interface.</span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="USE CASES" 
          value={useCaseCount} 
          subtext="Active scenarios"
          color="accent"
        />
        <MetricCard 
          label="PRODUCT" 
          value={pfCount} 
          subtext="Function groups"
          color="warning"
        />
        <MetricCard 
          label="TECHNICAL" 
          value={tfCount} 
          subtext="Implementations"
          color="success"
        />
        <MetricCard 
          label="PROGRESS" 
          value={overallProgress} 
          subtext={`${completedTfCount} of ${tfCount} completed`}
          color="accent"
          isPercent
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Access Card */}
        <div className="card-hover p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-5">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="status-dot status-dot-accent" />
              <h3 className="text-sm font-semibold text-text-primary">Quick Access</h3>
            </div>
            <p className="text-sm text-text-secondary mb-5 max-w-md leading-relaxed">
              Access the Use Case Matrix to view progress, manage mappings, and update completion status.
            </p>
            <a 
              href="/use-cases" 
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>View Use Cases</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Structure Access Card */}
        <div className="card-hover p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-5">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-warning">
              <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="status-dot status-dot-warning" />
              <h3 className="text-sm font-semibold text-text-primary">Function Structure</h3>
            </div>
            <p className="text-sm text-text-secondary mb-5 max-w-md leading-relaxed">
              Manage Technical Function progress directly. Track implementation status by Product Function hierarchy.
            </p>
            <a 
              href="/structure" 
              className="btn-primary inline-flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-warning)' }}
            >
              <span>View Structure</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Status Distribution</h3>
        <div className="flex items-center gap-8">
          <StatusItem 
            label="Completed" 
            value={completedTfCount} 
            percent={tfCount > 0 ? Math.round((completedTfCount / tfCount) * 100) : 0}
            color="success" 
          />
          <StatusItem 
            label="In Progress" 
            value={tfCount - completedTfCount} 
            percent={tfCount > 0 ? Math.round(((tfCount - completedTfCount) / tfCount) * 100) : 0}
            color="accent" 
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  subtext, 
  color = "accent",
  isPercent = false 
}: { 
  label: string; 
  value: number; 
  subtext: string; 
  color?: "accent" | "warning" | "success";
  isPercent?: boolean;
}) {
  const colorMap = {
    accent: { dot: "status-dot-accent", text: "text-accent", bg: "bg-accent-light" },
    warning: { dot: "status-dot-warning", text: "text-warning", bg: "bg-warning-light" },
    success: { dot: "status-dot-success", text: "text-success", bg: "bg-success-light" }
  };
  
  const styles = colorMap[color];

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-3">
        <span className={`status-dot ${styles.dot}`} />
        <span className="text-xs font-mono text-text-muted tracking-wide">{label}</span>
      </div>
      <div className={`text-3xl font-semibold ${styles.text} mb-1`}>
        {isPercent ? `${value}%` : value.toLocaleString()}
      </div>
      <div className="text-xs text-text-muted">
        {subtext}
      </div>
    </div>
  );
}

function StatusItem({ 
  label, 
  value, 
  percent, 
  color 
}: { 
  label: string; 
  value: number; 
  percent: number;
  color: "success" | "accent" | "warning";
}) {
  const colorMap = {
    success: { dot: "status-dot-success", fill: "progress-fill-success" },
    accent: { dot: "status-dot-accent", fill: "progress-fill-accent" },
    warning: { dot: "status-dot-warning", fill: "progress-fill-warning" }
  };
  
  const styles = colorMap[color];

  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <span className={`status-dot ${styles.dot}`} />
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-mono text-text-muted ml-auto">{value}</span>
      </div>
      <div className="progress-track">
        <div 
          className={`progress-fill ${styles.fill}`} 
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs font-mono text-text-muted mt-1 text-right">{percent}%</div>
    </div>
  );
}
