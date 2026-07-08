import { useTeachers, useResendInvite } from "../api";

export const TeacherListSection = () => {
  const { data, isLoading, error } = useTeachers();
  const resendMutation = useResendInvite();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Teachers</h3>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Teachers</h3>
        <p className="text-sm text-red-500">Could not load teachers.</p>
      </div>
    );
  }

  const teachers = data?.teachers ?? [];
  const pendingInvites = data?.pendingInvites ?? [];

  if (teachers.length === 0 && pendingInvites.length === 0) {
    return null;
  }

  const formatExpiry = (seconds: number) => {
    if (seconds < 60) return "Expiring soon";
    const hours = Math.round(seconds / 3600);
    return `${hours}h remaining`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-4">Teachers</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-400">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Assigned</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {pendingInvites.map((invite) => (
              <tr key={invite.id} className="border-b border-gray-50">
                <td className="py-2.5 text-gray-400">—</td>
                <td className="py-2.5 text-gray-500">{invite.email}</td>
                <td className="py-2.5">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    Pending
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{formatExpiry(invite.expiresIn)}</span>
                </td>
                <td className="py-2.5 text-gray-400">—</td>
                <td className="py-2.5">
                  <button
                    type="button"
                    onClick={() => resendMutation.mutate(invite.id)}
                    disabled={resendMutation.isPending}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {resendMutation.isPending ? "..." : "Resend"}
                  </button>
                </td>
              </tr>
            ))}
            {teachers.map((t) => (
              <tr key={t.id} className="border-b border-gray-50">
                <td className="py-2.5 text-gray-800">{t.name}</td>
                <td className="py-2.5 text-gray-500">{t.email}</td>
                <td className="py-2.5">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                </td>
                <td className="py-2.5 text-gray-500">
                  {t.formClass ? (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      Form: {t.formClass}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2.5" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
