import type { ReactNode } from "react";
import { DocumentUpload, TickCircle, Timer, Lock, Clock } from "iconsax-react";

const Tile = ({
  icon,
  bg,
  value,
  label,
}: {
  icon: ReactNode;
  bg: string;
  value: string | number;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-1.5 rounded-xl py-3">
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
    <p className="text-lg font-bold text-gray900 leading-none">{value}</p>
    <p className="text-[11px] text-gray500 text-center leading-tight">{label}</p>
  </div>
);

const StatusRow = ({
  icon,
  bg,
  label,
  status,
  statusClass,
}: {
  icon: ReactNode;
  bg: string;
  label: string;
  status: string;
  statusClass: string;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
      <span className="text-sm text-gray700">{label}</span>
    </div>
    <span className={`text-xs font-semibold ${statusClass}`}>{status}</span>
  </div>
);

export const AcademicsSection = () => (
  <div className="bg-white rounded-3xl border border-gray100 p-5">
    <h3 className="text-sm font-semibold text-gray900">Academics</h3>

    <div className="grid grid-cols-3 gap-2 mt-4">
      <Tile
        icon={<DocumentUpload size={16} color="#FBBC05" variant="Bold" />}
        bg="bg-[#FEF6E0]"
        value={15}
        label="Pending"
      />
      <Tile
        icon={<TickCircle size={16} color="#34A853" variant="Bold" />}
        bg="bg-[#E9F7EE]"
        value={17}
        label="Approved"
      />
      <Tile
        icon={<Timer size={16} color="#CD432F" variant="Bold" />}
        bg="bg-[#FFF0ED]"
        value={25}
        label="Overdue"
      />
    </div>
    <p className="text-[11px] uppercase tracking-wide text-gray400 text-center mt-2">
      Lesson notes
    </p>

    <div className="mt-4 pt-4 border-t border-gray100 space-y-3">
      <StatusRow
        icon={<Lock size={16} color="#34A853" variant="Bold" />}
        bg="bg-[#E9F7EE]"
        label="1st CA Broadsheets"
        status="Locked"
        statusClass="text-springgreen600"
      />
      <StatusRow
        icon={<Clock size={16} color="#4285F4" variant="Bold" />}
        bg="bg-[#EBF0FF]"
        label="2nd CA Broadsheets"
        status="Pending"
        statusClass="text-azure500"
      />
    </div>
  </div>
);