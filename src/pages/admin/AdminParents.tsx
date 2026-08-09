import { ParentsListSection } from "../../features/principal/components/ParentsListSection";

export const AdminParents = () => {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl md:text-2xl font-bold text-gray900">Parents</h1>
      <div className="mt-6">
        <ParentsListSection limit={50} />
      </div>
    </div>
  );
};
