import { LargeStatCard } from "./LargeStatCard";
import { SmallStatCard } from "./SmallStatCard";
import type { DashboardStats } from "../types";

interface StatsSectionProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export const StatsSection = ({ stats, isLoading }: StatsSectionProps) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
      <LargeStatCard
        label="Total Enrolled Students"
        value={isLoading ? "—" : String(stats?.students.total ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        trend="+4.2%"
        trendUp
      />
      <LargeStatCard
        label="Tuition Collected"
        value={isLoading ? "—" : `₦ ${(stats?.finance?.collectedThisTerm ?? 0).toLocaleString()}`}
        trend="+32.55%"
        trendUp
      />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <SmallStatCard label="Total Teachers" value={isLoading ? "—" : String(stats?.teachers.total ?? 0)} trend="+2%" trendUp />
      <SmallStatCard label="Active Students" value={isLoading ? "—" : String(stats?.students.active ?? 0)} trend="+4.2%" trendUp />
      <SmallStatCard label="Active Subjects" value={isLoading ? "—" : String(stats?.subjects.total ?? 0)} />
      <SmallStatCard label="Classes" value={isLoading ? "—" : String(stats?.classes.total ?? 0)} />
    </div>
  </>
);
