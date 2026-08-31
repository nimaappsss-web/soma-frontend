import { NavLink, Outlet, Navigate } from "react-router";
import { ClipboardTick, Activity, VolumeUp, People } from "iconsax-react";
import { cn } from "../../../lib/utils";
import { HelpHint } from "../../../components/ui/HelpHint";
import { useTeacherProfile } from "../../teacher/api";

const tabs = [
  { label: "Mark Scores", to: "/teach/ca-and-exams/mark-scores", Icon: ClipboardTick, classTeacherOnly: false },
  { label: "My Class", to: "/teach/ca-and-exams/my-class", Icon: People, classTeacherOnly: true },
  { label: "Broadcast", to: "/teach/ca-and-exams/broadcast", Icon: VolumeUp, classTeacherOnly: true },
  { label: "Active", to: "/teach/ca-and-exams/active", Icon: Activity, classTeacherOnly: false },
];

export const TeacherExaminationsLayout = () => {
  const { formClassId } = useTeacherProfile();
  const isClassTeacher = !!formClassId;
  const visibleTabs = tabs.filter((tab) => !tab.classTeacherOnly || isClassTeacher);

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 md:p-6 pb-0 w-full">
        <div className="group flex items-center gap-2.5 mb-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray900">CA &amp; Examinations</h1>
          <HelpHint
            title="CA &amp; Examinations"
            storageKey="teacher-ca-examinations"
            description="Record your subject CA &amp; exam scores, and pick up assessments you've started."
            sections={[
              { title: "Mark Scores", text: "Record each student's CA and exam scores for your subjects." },
              { title: "Active", text: "Pick up assessments you've already started working on." },
              { title: "How scores work", text: "Scores follow the scheme your school configured — enter them as you mark, and they roll up into report cards." },
            ]}
          />
        </div>
        <p className="text-sm text-gray500 mb-4">
          Record your subject CA &amp; exam scores, and pick up assessments you've started
        </p>

        <div className="flex w-full md:w-fit gap-1 mb-4 rounded-full bg-gray100 p-1 overflow-x-auto no-scrollbar">
          {visibleTabs.map((tab) => {
            const Icon = tab.Icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    "flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-gray900 text-white"
                      : "text-gray500 hover:text-gray700",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} color={isActive ? "#FFFFFF" : "#8C8C8C"} variant="Bold" />
                    {tab.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export const TeacherExaminationsIndex = () => <Navigate to="mark-scores" replace />;
