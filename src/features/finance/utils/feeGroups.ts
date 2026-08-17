import type { FeeItem, FeeStructure } from "../types";
import type { ClassCache } from "../../../db/db";

export const termOptions = [
  { value: "first", label: "First Term" },
  { value: "second", label: "Second Term" },
  { value: "third", label: "Third Term" },
];

export interface FeeGroup {
  groupId: string;
  name: string;
  term: string;
  session: string;
  amount: number;
  items: FeeItem[];
  isCompulsory: boolean;
  classes: string[];
  classIds: string[];
  schoolTypes: string[];
  sample: FeeStructure;
}

export const groupFees = (fees: FeeStructure[], classMap: Map<string, ClassCache>): FeeGroup[] => {
  return fees.map((fee) => {
    const classIds = fee.classIds ?? [];
    const classes = (fee.classNames ?? []).slice();
    const schoolTypes: string[] = [];
    for (const cid of classIds) {
      const cls = classMap.get(cid);
      if (cls?.schoolType && !schoolTypes.includes(cls.schoolType)) {
        schoolTypes.push(cls.schoolType);
      }
    }
    return {
      groupId: fee.id,
      name: fee.name,
      term: fee.term,
      session: fee.session,
      amount: fee.amount,
      items: fee.items ?? [],
      isCompulsory: fee.isCompulsory,
      classes,
      classIds,
      schoolTypes,
      sample: fee,
    };
  });
};

export const classNames = (classes: string[]) => {
  if (classes.length === 0) return "All selected classes";
  if (classes.length <= 2) return classes.join(", ");
  return `${classes.slice(0, 2).join(", ")} +${classes.length - 2}`;
};