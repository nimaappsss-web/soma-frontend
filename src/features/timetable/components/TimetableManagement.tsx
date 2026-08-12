import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, Calendar, CalendarTick, Element4, Setting2, TickCircle } from "iconsax-react";

import { cn } from "../../../lib/utils";
import { SelectDropdown, type SelectOption } from "../../../components/ui/select-dropdown";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { useClasses } from "../../principal/api";
import { useTimetableCache, useTimetableConfigs } from "../api";
import { effectiveSchoolType } from "../../../utils/schoolType";

type StatusFilter = "all" | "configured" | "none";

const FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "configured", label: "Configured" },
  { key: "none", label: "Not configured" },
];

export const TimetableManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get("status");
  const statusFilter: StatusFilter = FILTER_OPTIONS.some((o) => o.key === statusParam)
    ? (statusParam as StatusFilter)
    : "all";

  const setStatusFilter = (key: StatusFilter) => {
    const next = new URLSearchParams(searchParams);
    if (key === "all") {
      next.delete("status");
    } else {
      next.set("status", key);
    }
    setSearchParams(next, { replace: true });
  };

  const { data: classesData, isLoading: classesLoading } = useClasses();
  const classes = classesData?.classes ?? [];
  const { entries: allEntries, isLoading: entriesLoading } = useTimetableCache();
  const { data: configs } = useTimetableConfigs();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of allEntries) {
      map.set(e.classId, (map.get(e.classId) ?? 0) + 1);
    }
    return map;
  }, [allEntries]);

  const configuredCount = useMemo(
    () => classes.filter((c) => (counts.get(c.id) ?? 0) > 0).length,
    [classes, counts],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "configured") return classes.filter((c) => (counts.get(c.id) ?? 0) > 0);
    if (statusFilter === "none") return classes.filter((c) => (counts.get(c.id) ?? 0) === 0);
    return classes;
  }, [statusFilter, classes, counts]);

  const classOptions: SelectOption[] = classes
    .map((c) => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="w-full p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-56 md:w-64">
          <SelectDropdown
            options={classOptions}
            value=""
            onChange={(value) => navigate(`/admin/timetable/${value}`)}
            placeholder="Jump to a class…"
            searchable
          />
        </div>
      </div>

      {classes.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-input bg-card p-1">
            {FILTER_OPTIONS.map((opt) => {
              const active = statusFilter === opt.key;
              const count =
                opt.key === "configured"
                  ? configuredCount
                  : opt.key === "none"
                    ? classes.length - configuredCount
                    : classes.length;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatusFilter(opt.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
                  )}
                >
                  {opt.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px] tabular-nums",
                      active ? "bg-white/15 text-white" : "bg-gray50 text-gray500",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {classesLoading ? (
        <div className="flex justify-center py-20">
          <SomaLoader />
        </div>
      ) : classes.length === 0 ? (
        <div className="mt-10 rounded-xl border border-input bg-card p-10 text-center">
          <Calendar size={28} color="#BBBBBB" className="mx-auto" />
          <p className="mt-3 text-sm text-placeholder">No classes yet. Create a class to start a timetable.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-input bg-card p-10 text-center">
          <CalendarTick size={28} color="#BBBBBB" className="mx-auto" />
          <p className="mt-3 text-sm text-placeholder">
            {statusFilter === "configured"
              ? "No classes have a configured timetable yet."
              : "Every class already has a timetable."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cls) => {
            const count = counts.get(cls.id) ?? 0;
            const scheduled = count > 0;
            const configType = effectiveSchoolType(cls.schoolType);
            const config = configType ? configs[configType] : undefined;
            return (
              <Link
                key={cls.id}
                to={`/admin/timetable/${cls.id}`}
                className="group flex flex-col gap-4 rounded-xl border border-input bg-card p-5 transition-colors hover:border-azure500/50 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray900">{cls.name}</p>
                    <p className="mt-0.5 text-xs text-placeholder">
                      {cls.level ? `${cls.level} · ` : ""}class timetable
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    color="#BBBBBB"
                    className="mt-1 shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </div>

                <div className="mt-auto space-y-1.5">
                  {config ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-azure500/10 px-3 py-1 text-xs font-medium text-azure500">
                      <Setting2 size={13} color="#4285F4" />
                      {config.name}
                    </span>
                  ) : configType ? (
                    <span
                      role="button"
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-amber400/10 px-3 py-1 text-xs font-medium text-amber500 transition-colors hover:bg-amber400/20"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/admin/timetable/configs?type=${encodeURIComponent(configType)}&edit=1`);
                      }}
                    >
                      <Setting2 size={13} color="#FBBC05" />
                      No configuration set
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber400/10 px-3 py-1 text-xs font-medium text-amber500">
                      <Setting2 size={13} color="#FBBC05" />
                      No configuration
                    </span>
                  )}
                  {entriesLoading ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray50 px-3 py-1 text-xs text-placeholder">
                      Checking…
                    </span>
                  ) : scheduled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-springgreen600/10 px-3 py-1 text-xs font-medium text-springgreen600">
                      <TickCircle size={14} color="#34A853" />
                      {count} lesson{count !== 1 ? "s" : ""} scheduled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray50 px-3 py-1 text-xs text-placeholder">
                      <CalendarTick size={14} color="#B3B3B3" />
                      Not scheduled
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {classes.length > 12 && (
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-placeholder">
          <Element4 size={14} color="#B3B3B3" />
          {classes.length} classes · use the filter above to jump to any timetable
        </div>
      )}
    </div>
  );
};