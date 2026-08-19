import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import type { AxiosErrorResponse, SchoolInfo } from "../types";
import type { ManualBankDetails } from "../../settings/types";

const TIMEOUT = 3000;

interface UpdateSchoolPayload {
  name?: string;
  state?: string;
  lga?: string;
  schoolType?: string[];
  address?: string;
  logo?: string;
  arms?: string[];
  admissionPattern?: string;
  assessmentMode?: "standard" | "thirdTermAverage";
  manualBankDetails?: ManualBankDetails;
}

export const useUpdateSchool = () => {
  const { user } = useAuth();

  return useMutation<void, AxiosErrorResponse, UpdateSchoolPayload>({
    mutationFn: async (payload) => {
      await Promise.race([
        (async () => {
          const existing = await db.schoolSettings.where("id").equals("school-info").first();
          const current: Partial<SchoolInfo> = existing ? JSON.parse(existing.settingsJson) : {};
          const merged: SchoolInfo = { ...current as SchoolInfo, ...payload } as SchoolInfo;
          await db.schoolSettings.put({
            id: "school-info",
            userId: user!.id,
            settingsJson: JSON.stringify(merged),
            updatedAt: Date.now(),
          });
          await addToQueue({
            userId: user!.id,
            table: "schoolSettings",
            recordId: "school-info",
            endpoint: "/school",
            method: "PATCH",
            payload,
          });
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
    },
    onSuccess: async () => {
      toast.success("School updated!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
