import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarTick, Edit2 } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import { SelectDropdown, type SelectOption } from "../../../components/ui/select-dropdown";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { useClasses } from "../../principal/api";
import { useTimetableCache } from "../api";
import { TimetableGrid } from "./TimetableGrid";
import { TimetableMobile } from "./TimetableMobile";
import { TimetableWizard } from "./wizard/TimetableWizard";

export const TimetableView = () => {
  const { classId = "" } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [building, setBuilding] = useState(false);

  const { data: classesData, isLoading: classesLoading } = useClasses();
  const classes = classesData?.classes ?? [];
  const current = classes.find((c) => c.id === classId);

  const classOptions: SelectOption[] = classes
    .map((c) => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const { entries, breaks, isLoading, error, refresh } = useTimetableCache(classId || undefined);

  if (building && classId && current) {
    return (
      <TimetableWizard
        classId={classId}
        className={current.name}
        onCancel={() => setBuilding(false)}
        onPublished={() => {
          setBuilding(false);
          refresh();
        }}
      />
    );
  }

  if (classesLoading) {
    return (
      <div className="flex justify-center py-20">
        <SomaLoader />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-placeholder">This class could not be found.</p>
        <Link
          to="/admin/timetable"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} color="#4285F4" />
          Back to timetables
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/timetable"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-input bg-card text-gray500 transition-colors hover:bg-gray50"
            aria-label="Back to all timetables"
          >
            <ArrowLeft size={18} color="#8C8C8C" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray900 md:text-2xl">{current.name} timetable</h1>
            <p className="text-sm text-placeholder">
              {entries.length > 0 ? `${entries.length} lessons scheduled` : "Nothing scheduled yet"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48 md:w-56">
            <SelectDropdown
              options={classOptions}
              value={classId}
              onChange={(value) => navigate(`/admin/timetable/${value}`)}
              placeholder="Switch class"
              searchable
            />
          </div>
          <Button size="lg" onClick={() => setBuilding(true)}>
            <Edit2 size={16} color="#FFFFFF" />
            {entries.length > 0 ? "Edit timetable" : "Build timetable"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <SomaLoader />
        </div>
      ) : error ? (
        <div className="mt-10 rounded-xl border border-input p-8 text-center text-sm text-placeholder">
          Could not load the timetable.
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-10 rounded-xl border border-input bg-card p-10 text-center">
          <CalendarTick size={28} color="#BBBBBB" className="mx-auto" />
          <p className="mt-3 text-sm text-placeholder">
            No timetable yet for {current.name}. Build one to assign subjects to periods.
          </p>
          <Button className="mt-4" onClick={() => setBuilding(true)}>
            Build timetable
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="hidden md:block">
            <TimetableGrid periodsPerDay={9} entries={entries} breaks={breaks} showTeacher />
          </div>
          <div className="md:hidden">
            <TimetableMobile periodsPerDay={9} entries={entries} breaks={breaks} />
          </div>
          <div className="flex items-center justify-between text-xs text-placeholder">
            <span>{entries.length} lessons · concept grid</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setBuilding(true)}>
              <Edit2 size={14} color="#8C8C8C" />
              Build / edit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};