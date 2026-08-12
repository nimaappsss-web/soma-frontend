import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Add, Profile2User, Trash } from "iconsax-react";

import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { useClasses } from "../../principal/api";
import { useDeleteTimetableConfig, useTimetableConfigs } from "../api";
import { TimetableConfigEditor } from "./wizard/TimetableConfigEditor";
import { type SchoolTypeConfig } from "../types";
import { effectiveSchoolType, schoolTypeLabel } from "../../../utils/schoolType";

const CONFIG_TYPES: SchoolTypeConfig[] = [
  "creche",
  "kg",
  "primary",
  "junior-secondary",
  "senior-secondary",
  "custom",
];

const LABELS = Object.fromEntries(
  CONFIG_TYPES.map((t) => [t, schoolTypeLabel(t)]),
) as Record<SchoolTypeConfig, string>;

const MESSAGES: Record<SchoolTypeConfig, string> = {
  creche: "Nursery / creche classes (e.g. Creche 1, Creche 2).",
  kg: "Kindergarten classes (e.g. KG 1, KG 2).",
  primary: "Primary 1 – 6 classes share one schedule & subject setup.",
  "junior-secondary": "Junior secondary classes (JSS 1 – JSS 3) share one schedule & subject setup.",
  "senior-secondary": "Senior secondary classes (SS 1 – SS 3) — use one config per arm batch if needed.",
  custom: "Any other group you want to treat as a batch.",
};

export const TimetableConfigsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingType, setEditingType] = useState<SchoolTypeConfig | null>(null);
  const [quickSetup, setQuickSetup] = useState(false);

  const { data: classesData, isLoading: classesLoading } = useClasses();
  const classes = classesData?.classes ?? [];

  const { data: configs, isLoading: configsLoading } = useTimetableConfigs();
  const delConfig = useDeleteTimetableConfig();

  // Deep link from a class card's "No configuration set" badge:
  // /admin/timetable/configs?type=<configType>&edit=1 — opens that batch's
  // editor in quick mode (defaults prefilled, straight to the Save step).
  useEffect(() => {
    const param = searchParams.get("type") ?? "";
    if ((CONFIG_TYPES as string[]).includes(param)) {
      setEditingType(param as SchoolTypeConfig);
      setQuickSetup(searchParams.get("edit") === "1");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openEditor = (type: SchoolTypeConfig, quick: boolean) => {
    setEditingType(type);
    setQuickSetup(quick);
  };

  if (editingType) {
    return (
      <TimetableConfigEditor
        configType={editingType}
        initial={configs[editingType] ?? null}
        quick={quickSetup}
        onDone={() => setEditingType(null)}
        onCancel={() => setEditingType(null)}
      />
    );
  }

  if (classesLoading || configsLoading) {
    return (
      <div className="flex justify-center py-20">
        <SomaLoader />
      </div>
    );
  }

  const groups = CONFIG_TYPES.map((type) => ({
    type,
    classes: classes.filter((c) => effectiveSchoolType(c.schoolType) === type),
    config: configs[type],
  }));

  return (
    <div className="w-full p-4 md:p-6">
      <div className="mt-2 space-y-4">
        {groups.map(({ type, classes: batch, config }) => (
          <div key={type} className="rounded-xl border border-input bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray900">{LABELS[type]}</p>
                <p className="mt-1 max-w-md text-xs text-placeholder">{MESSAGES[type]}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray500">
                  <Profile2User size={14} color="#8C8C8C" />
                  {batch.length} class{batch.length !== 1 ? "es" : ""}
                  {batch.length > 0 && batch.length <= 12
                    ? ` — ${batch.map((c) => c.name).join(", ")}`
                    : ""}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {config ? (
                  <>
                    <span className="inline-flex max-w-[16rem] truncate rounded-full bg-azure500/10 px-3 py-1 text-xs font-medium text-azure500">
                      {config.name}
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditor(type, false)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-placeholder"
                      onClick={() => {
                        if (window.confirm(`Delete the ${LABELS[type].toLowerCase()} configuration? Classes in this batch will build without a configuration until you create one.`)) {
                          delConfig.mutate(type);
                        }
                      }}
                      disabled={delConfig.isPending}
                    >
                      <Trash size={16} color="#8C8C8C" />
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => openEditor(type, false)}>
                    <Add size={16} color="#0D0D0D" />
                    Set up configuration
                  </Button>
                )}
              </div>
            </div>

            {config ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-gray50 px-2.5 py-0.5 text-[11px] text-gray500">
                  {(config.schedule ?? []).reduce(
                    (sum, b) => sum + (Array.isArray(b.days) ? b.days.length * (b.periodCount ?? 0) : 0),
                    0,
                  )}{" "}
                  slots/wk
                </span>
                <span className="rounded-full bg-gray50 px-2.5 py-0.5 text-[11px] text-gray500">
                  {config.subjectIds?.length ?? 0} subjects
                </span>
                {Object.values(config.targets ?? {}).reduce((a, b) => a + b, 0) > 0 && (
                  <span className="rounded-full bg-gray50 px-2.5 py-0.5 text-[11px] text-gray500">
                    {Object.values(config.targets ?? {}).reduce((a, b) => a + b, 0)} targeted periods
                  </span>
                )}
                <span className="rounded-full bg-gray50 px-2.5 py-0.5 text-[11px] text-gray500">
                  {(config.doublePeriods ?? []).length} double-periods
                </span>
              </div>
            ) : (
              <div
                className={cn(
                  "mt-3 rounded-lg border border-dashed px-3 py-2 text-xs",
                  batch.length > 0
                    ? "border-amber400/40 bg-amber400/5 text-amber500"
                    : "border-input text-placeholder",
                )}
              >
                {batch.length > 0
                  ? `No configuration set — ${LABELS[type].toLowerCase()} classes (${
                      batch.length
                    }) aren't locked to a shared setup yet.`
                  : "No classes of this type yet."}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};