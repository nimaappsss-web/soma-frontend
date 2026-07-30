import { useDashboardStats } from "../api";
import { ProgressSection } from "./ProgressSection";
import { SetupChecklist } from "./SetupChecklist";
import { DateFilterBar } from "./DateFilterBar";
import { StatsSection } from "./StatsSection";
import { AcademicsSection } from "./AcademicsSection";
import { OperationsSection } from "./OperationsSection";

export const DashboardHome = () => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="p-6 w-full">
      <ProgressSection percentage={30} />
      <SetupChecklist />
      <DateFilterBar />
      <StatsSection stats={stats} isLoading={isLoading} />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <AcademicsSection />
        <OperationsSection stats={stats} isLoading={isLoading} />
      </div>
    </div>
  );
};
