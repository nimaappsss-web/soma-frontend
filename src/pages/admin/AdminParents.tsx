import { ParentsListSection } from "../../features/principal/components/ParentsListSection";
import { HelpHint } from "../../components/ui/HelpHint";

export const AdminParents = () => {
  return (
    <div className="p-6 w-full">
      <div className="group flex items-center gap-2.5">
        <h1 className="text-xl md:text-2xl font-bold text-gray900">Parents</h1>
        <HelpHint
          title="Parents"
          storageKey="parents"
          description="Track the guardians connected to your students."
          sections={[
            { title: "Invite parents", text: "Invite a parent by email so they can create a linked account and see their child's updates." },
            { title: "Pending invites", text: "Parents who haven't set up their account yet stay under Pending — resend their invite anytime." },
            { title: "Search & browse", text: "Use the search bar to find a parent by name or email, and open a record to see their linked students." },
          ]}
        />
      </div>
      <div className="mt-6">
        <ParentsListSection limit={50} />
      </div>
    </div>
  );
};
