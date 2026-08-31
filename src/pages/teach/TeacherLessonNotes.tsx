import { ComingSoon } from "../../components/ui/ComingSoon";

export const TeacherLessonNotes = () => {
  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6">
        <div className="group flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-bold text-gray900">Lesson Notes</h1>
        </div>
        <p className="text-sm text-gray500 mt-1">Plan and write lesson notes for your subjects</p>
      </div>
      <ComingSoon
        title="Lesson Notes coming soon"
        description="Lesson notes and AI-assisted planning are on the way. Check back soon."
      />
    </div>
  );
};
