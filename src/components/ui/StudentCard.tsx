import type { Student } from "../../features/students/types";

interface StudentCardProps {
  student: Student;
}

export const StudentCard = ({ student }: StudentCardProps) => (
  <div className="w-full h-full bg-blue-500 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center">
    <p className="text-xl font-bold text-center text-white">{student.name}</p>
    <p className="text-gray-200 text-center text-sm mt-1">
      {student.classId}
    </p>
  </div>
);
