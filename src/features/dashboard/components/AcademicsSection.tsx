import { ArrowRight } from "iconsax-react";

interface RowProps {
  label: string;
  value: string | number;
  color: string;
}

export const AcademicsRow = ({ label, value, color }: RowProps) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="flex items-center gap-2.5">
      <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-sm text-gray700">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray900">{value}</span>
      <ArrowRight variant="Bold" size={14} className="text-gray300" />
    </div>
  </div>
);

export const AcademicsSection = () => (
  <div className="bg-white rounded-3xl border border-gray100 p-5">
    <h3 className="text-sm font-semibold text-gray900 mb-4">Academics</h3>
    <div className="space-y-3">
      <AcademicsRow label="Pending Lesson Notes" value={15} color="bg-red500" />
      <AcademicsRow label="Approved Lesson Notes" value={17} color="bg-amber500" />
      <AcademicsRow label="Overdue Lesson Notes" value={25} color="bg-red500" />
      <AcademicsRow label="1st CA Broadsheets Locked" value="Locked" color="bg-springgreen600" />
      <AcademicsRow label="2nd CA Broadsheets" value="Pending" color="bg-azure500" />
    </div>
  </div>
);
