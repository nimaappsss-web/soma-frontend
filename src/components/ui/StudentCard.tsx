import { Avatar } from "./Avatar";
import type { Student } from "../../features/students/types";

interface StudentCardProps {
  student: Student;
}

export const StudentCard = ({ student }: StudentCardProps) => (
  <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 flex flex-col items-center justify-center overflow-hidden">
    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16" />

    <Avatar
      name={student.name}
      size={88}
      className="border-4 border-white/30 shadow-lg mb-5"
    />

    <p className="text-xl font-bold text-center text-white leading-tight">
      {student.name}
    </p>
  </div>
);
