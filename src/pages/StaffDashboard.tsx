import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "../contexts/AuthContext";
export const StaffDashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">{user?.schoolName}</span>
          <Avatar name={user?.name ?? ""} size={24} className="inline-block align-middle" />
          <span className="text-sm text-gray-700">{user?.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
            {user?.role}
          </span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Staff Portal</h2>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-500">Coming soon.</p>
        </div>
      </main>
    </div>
  );
};
