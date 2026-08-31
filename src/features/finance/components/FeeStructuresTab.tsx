import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useOutletContext } from "react-router";
import { Add, Wallet3, Filter, ArrowRight } from "iconsax-react";

import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { BottomSheet } from "../../../components/mobile/BottomSheet";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useFeeStructures } from "../api";
import { useClasses } from "../../principal/api";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";
import { schoolTypeLabel } from "../../../utils/schoolType";
import { formatNaira } from "../utils/currency";
import { FeeStructureFormDialog } from "./FeeStructureFormDialog";
import { groupFees, classNames, termOptions } from "../utils/feeGroups";

export const FeeStructuresTab = () => {
  const { data, isLoading } = useFeeStructures();
  const { data: classesData } = useClasses();
  const { activeTerm } = useActiveTerm();
  const { setHeaderAction } = useOutletContext<{ setHeaderAction: (node: ReactNode) => void }>();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [termFilter, setTermFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const classes = useMemo(() => classesData?.classes ?? [], [classesData]);
  const feeStructures = useMemo(() => data?.feeStructures ?? [], [data]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const allGroups = useMemo(() => groupFees(feeStructures, classMap), [feeStructures, classMap]);
  const classOptions = useMemo(() => classes.map((c) => ({ value: c.id, label: c.name })), [classes]);
  const classIdToName = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

  const schoolTypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const g of allGroups) for (const t of g.schoolTypes) set.add(t);
    return Array.from(set)
      .sort()
      .map((t) => ({ value: t, label: schoolTypeLabel(t) }));
  }, [allGroups]);

  const groups = useMemo(() => {
    let list = allGroups;
    if (termFilter) list = list.filter((g) => g.term === termFilter);
    if (typeFilter) list = list.filter((g) => g.schoolTypes.includes(typeFilter));
    return list;
  }, [allGroups, termFilter, typeFilter]);
  const hasFilters = !!termFilter || !!typeFilter;

  useEffect(() => {
    setHeaderAction(
      <div className="flex items-center gap-2.5">
        {allGroups.length > 0 && (
          <>
            <div className="hidden md:flex items-center gap-2.5">
              <SelectDropdown
                options={termOptions}
                value={termFilter}
                onChange={setTermFilter}
                placeholder="All Terms"
                buttonClassName="h-10 text-sm"
                menuClassName="min-w-[180px]"
              />
              <SelectDropdown
                options={schoolTypeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
                placeholder="All School Types"
                buttonClassName="h-10 text-sm"
                menuClassName="min-w-[200px]"
              />
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { setTermFilter(""); setTypeFilter(""); }}
                  className="text-sm font-medium text-gray-500 hover:text-gray900 underline underline-offset-4 shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="flex md:hidden h-[44px] w-[44px] items-center justify-center rounded-[15px] border border-input bg-background shrink-0"
            >
              <Filter size={16} color="#0D0D0D" variant="Linear" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray900 px-4 text-sm font-medium text-white hover:bg-gray800"
        >
          <Add size={20} color="#FFFFFF" variant="Linear" />
          Add Fee Structure
        </button>
      </div>,
    );
    return () => setHeaderAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeaderAction, allGroups.length, termFilter, typeFilter, hasFilters]);

  return (
    <div className="w-full">
      {allGroups.length > 0 && (
        <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
          <div className="space-y-4">
            <SelectDropdown
              options={termOptions}
              value={termFilter}
              onChange={setTermFilter}
              placeholder="All Terms"
              buttonClassName="h-10 text-sm"
              menuClassName="min-w-[200px]"
            />
            <SelectDropdown
              options={schoolTypeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="All School Types"
              buttonClassName="h-10 text-sm"
              menuClassName="min-w-[200px]"
            />
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setTermFilter(""); setTypeFilter(""); }}
                className="w-full rounded-full border border-input py-3 text-sm font-medium text-gray900"
              >
                Clear filters
              </button>
            )}
          </div>
        </BottomSheet>
      )}

      {!isLoading && groups.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={<Wallet3 color="#0D0D0D" />}
            title="No fee structures match"
            description="Try clearing the term or school type filters to see all fee structures."
            actionLabel="Clear filters"
            onAction={() => { setTermFilter(""); setTypeFilter(""); }}
          />
        ) : (
          <EmptyState
            icon={<Wallet3 color="#0D0D0D" />}
            title="No fee structures yet"
            description="Add a fee for one or more classes and a term — parents will pay against these."
            actionLabel="Add Fee Structure"
            onAction={() => setDialogOpen(true)}
            actionIcon={<Add size={15} color="#FFFFFF" />}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Link
              key={group.groupId}
              to={`/admin/finance/fee-structures/${group.groupId}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)]"
            >
              <div className="h-1.5 w-full bg-gray900" />

              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray50 transition-colors group-hover:bg-gray900">
                    <Wallet3 size={20} variant="Bold" color="#0D0D0D" className="transition-colors group-hover:hidden" />
                    <Wallet3 size={20} variant="Bold" color="#FFFFFF" className="hidden transition-colors group-hover:block" />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray50 px-2.5 py-1 text-xs font-medium text-gray500">
                    {termLabel(group.term).label}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-gray900 leading-snug">{group.name}</p>
                  <p className="mt-1 text-xs text-gray-400 leading-snug break-words">
                    {group.session} · {group.isCompulsory ? "Compulsory" : "Optional"}
                  </p>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-gray-50 pt-4">
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-gray900">{formatNaira(group.amount)}</p>
                    <p className="mt-0.5 break-words text-xs text-gray-400 leading-snug">
                      {classNames(group.classes)}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-100 text-gray400 transition-all group-hover:bg-gray900 group-hover:text-white group-hover:border-gray900">
                    <ArrowRight size={15} color="#8C8C8C" className="group-hover:hidden" />
                    <ArrowRight size={15} color="#FFFFFF" className="hidden group-hover:block" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <FeeStructureFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={null}
        activeTerm={activeTerm?.term ?? "first"}
        classOptions={classOptions}
        classIdToName={classIdToName}
        existingFees={feeStructures}
      />
    </div>
  );
};