import { CalendarTick, Book, RulerPen, Briefcase, Teacher, Card } from "iconsax-react";
import { SetupCard } from "./SetupCard";

export interface SetupCompleted {
  terms: boolean;
  subjects: boolean;
  classes: boolean;
  teachers: boolean;
  studentsParents: boolean;
  bankDetails: boolean;
}

const setupItems = [
  {
    key: "terms" as const,
    title: "School Terms & Ranking",
    subtitle: "Term structure, and ranking rules",
    icon: CalendarTick,
    bgColor: "bg-springgreen600/10",
    iconColor: "text-springgreen600",
    to: "/admin/calendar/terms",
  },
  {
    key: "subjects" as const,
    title: "Configure Subject Directory",
    subtitle: "Setup core subjects",
    icon: Book,
    bgColor: "bg-red-100",
    iconColor: "text-red-500",
    to: "/admin/subjects",
  },
  {
    key: "classes" as const,
    title: "Create Classes",
    subtitle: "Define class levels and specific arms",
    icon: RulerPen,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    to: "/admin/classes",
  },
  {
    key: "teachers" as const,
    title: "Invite Teachers",
    subtitle: "Onboard teachers and staff",
    icon: Briefcase,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    to: "/admin/teachers",
  },
  {
    key: "studentsParents" as const,
    title: "Add Students & Parents",
    subtitle: "Upload student records and link primary guardian contacts.",
    icon: Teacher,
    bgColor: "bg-gray-100",
    iconColor: "text-black",
    to: "/admin/students",
  },
  {
    key: "bankDetails" as const,
    title: "Add Bank Account Details",
    subtitle: "The account parents pay fees into.",
    icon: Card,
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-600",
    to: "/admin/settings",
  },
];

export const SetupChecklist = ({ completed }: { completed: SetupCompleted }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.75 mt-5">
    {setupItems.map((item) => (
      <SetupCard
        key={item.key}
        title={item.title}
        subtitle={item.subtitle}
        icon={<item.icon variant="Bold" size={24} color="currentColor" />}
        bgColor={item.bgColor}
        iconColor={item.iconColor}
        completed={completed[item.key]}
        to={item.to}
      />
    ))}
  </div>
);
