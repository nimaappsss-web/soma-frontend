import { HelpHint } from "../../../components/ui/HelpHint";

export const StaffManagement = () => {
  return (
    <div className="p-6 w-full">
      <div className="group flex items-center gap-2.5">
        <h1 className="text-xl md:text-2xl font-bold text-gray900">Non-Teaching Staff</h1>
        <HelpHint
          title="Non-Teaching Staff"
          storageKey="staff"
          description="Manage your school's non-teaching staff."
          sections={[
            { title: "What's here", text: "This is where non-teaching staff accounts will live once enabled." },
            { title: "Coming soon", text: "Invites, profiles, and role management are on the way." },
          ]}
        />
      </div>
      <p className="text-sm text-gray-400 mt-1">Manage your school's non-teaching staff</p>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 text-center">
        <p className="text-sm text-gray-400">Staff management coming soon</p>
      </div>
    </div>
  );
};
