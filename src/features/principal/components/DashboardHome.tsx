import { Link } from "react-router";
import { useDashboardStats } from "../api";

export const DashboardHome = () => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="text-sm text-gray-400 mt-1">Overview of your school</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <DashboardCard label="Students" value={isLoading ? "—" : String(stats?.students?.total ?? "—")} to="/admin/students" />
        <DashboardCard label="Teachers" value={isLoading ? "—" : String(stats?.teachers?.total ?? "—")} to="/admin/teachers" />
        <DashboardCard label="Classes" value={isLoading ? "—" : String(stats?.classes?.total ?? "—")} to="/admin/classes" />
        <DashboardCard label="Parents" value={isLoading ? "—" : String(stats?.parents?.total ?? "—")} to="/admin/parents" />
        <DashboardCard label="Subjects" value={isLoading ? "—" : String(stats?.subjects?.total ?? "—")} to="/admin/subjects" />
      </div>
    </div>
  );
};

const DashboardCard = ({ label, value, to }: { label: string; value: string; to: string }) => (
  <Link
    to={to}
    className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors"
  >
    <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
  </Link>
);
