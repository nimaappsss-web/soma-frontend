import { CalendarTick, Book, RulerPen, Briefcase, Teacher } from "iconsax-react";
import { SetupCard } from "./SetupCard";

const setupItems = [
  {
    title: "School Terms & Ranking",
    subtitle: "Term structure, and ranking rules",
    icon: CalendarTick,
    bgColor: "bg-springgreen600/10",
    iconColor: "text-springgreen600",
    completed: true,
  },
  {
    title: "Configure Subject Directory",
    subtitle: "Setup core subjects",
    icon: Book,
    bgColor: "bg-red-100",
    iconColor: "text-red-500",
    to: "/admin/subjects",
  },
  {
    title: "Create Classes",
    subtitle: "Define class levels and specific arms",
    icon: RulerPen,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    to: "/admin/classes",
  },
  {
    title: "Invite Teachers",
    subtitle: "Onboard teachers and staff",
    icon: Briefcase,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    to: "/admin/teachers",
  },
  {
    title: "Add Students & Parents",
    subtitle: "Upload student records and link primary guardian contacts.",
    icon: Teacher,
    bgColor: "bg-gray-100",
    iconColor: "text-black",
    to: "/admin/students",
  },
];

export const SetupChecklist = () => (
  <div className="grid grid-cols-2 gap-3.75 mt-5">
    {setupItems.map((item) => (
      <SetupCard
        key={item.title}
        title={item.title}
        subtitle={item.subtitle}
        icon={<item.icon variant="Bold" size={24} color="currentColor" />}
        bgColor={item.bgColor}
        iconColor={item.iconColor}
        completed={item.completed}
        to={item.to}
      />
    ))}
  </div>
);
