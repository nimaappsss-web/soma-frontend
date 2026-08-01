import { Avatar } from "./Avatar";
import type { Student } from "../../features/students/types";

interface StudentCardProps {
  student: Student;
}

export const StudentCard = ({ student }: StudentCardProps) => (
  <div className="relative w-full h-full bg-white rounded-tl-2xl rounded-tr-[48px] rounded-br-2xl rounded-bl-[48px] flex flex-col items-center justify-center overflow-hidden select-none">
    <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.02)_40%,transparent_70%)]" />
    <div className="absolute top-10 -left-16 w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.04)_0%,transparent_70%)]" />
    <div className="absolute bottom-16 right-0 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.035)_0%,transparent_70%)]" />

    <div className="absolute top-6 left-6 w-10 h-1 rounded-full bg-black/10" />
    <div className="absolute top-6 right-6 w-6 h-6 rounded-full border-2 border-dashed border-black/10" />

    <img
      src="/icons/somawordmark_black.svg"
      alt=""
      draggable={false}
      className="absolute -bottom-6 -left-8 w-[340px] h-auto opacity-20 pointer-events-none translate-y-[-15px]"
    />

    <div className="relative flex flex-col items-center">
      <div className="relative mb-6">
        <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-black/10 via-transparent to-black/5 blur-md" />
        <Avatar
          name={student.name}
          size={96}
          className="relative border-4 border-white shadow-xl ring-1 ring-black/5"
        />
      </div>

      <p className="text-[22px] font-bold text-center text-gray-900 leading-snug px-8 max-w-full">
        {student.name}
      </p>
    </div>
  </div>
);
