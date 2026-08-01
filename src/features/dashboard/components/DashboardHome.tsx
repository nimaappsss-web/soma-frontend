import { useCallback } from "react";
import { useDashboardStats } from "../api";
import { useSetupProgress } from "../api/useSetupProgress";
import { useAuth } from "../../../contexts/AuthContext";
import { ProgressSection } from "./ProgressSection";
import { SetupChecklist } from "./SetupChecklist";
import { DateFilterBar } from "./DateFilterBar";
import { StatsSection } from "./StatsSection";
import { AcademicsSection } from "./AcademicsSection";
import { OperationsSection } from "./OperationsSection";

export const DashboardHome = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { completed, percentage, storedPercentage, markSeen } = useSetupProgress();

  const handleSeen = useCallback(() => {
    markSeen();
  }, [markSeen]);

  const isSetupComplete = percentage >= 100;
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="p-4 md:p-6 w-full">
      <ProgressSection
        percentage={percentage}
        storedPercentage={storedPercentage}
        onSeen={handleSeen}
        userName={firstName}
        complete={isSetupComplete}
      />
      {!isSetupComplete && <SetupChecklist completed={completed} />}
      <DateFilterBar />
      <StatsSection stats={stats} isLoading={isLoading} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <AcademicsSection />
        <OperationsSection stats={stats} isLoading={isLoading} />
      </div>
    </div>
  );
};
