export const ProgressSection = ({ percentage = 30 }: { percentage?: number }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-2">
    <div className="shrink-0">
      <h1 className="text-2xl font-bold text-gray900">Hello</h1>
      <p className="text-sm text-gray500 mt-0.5">Let's set up your school.</p>
    </div>
    <div className="flex-1 w-full flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray100 rounded-full overflow-hidden">
        <div className="h-full bg-gray900 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-sm text-black shrink-0">{percentage}%</span>
    </div>
  </div>
);
