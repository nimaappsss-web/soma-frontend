import { useState } from "react";
import { Profile2User, StatusUp, MedalStar } from "iconsax-react";
import { cn } from "@/lib/utils";
import { useTeacherProfile } from "../../teacher/api";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";
import { useBroadcastStatus } from "../api";
import { transformError } from "../../../utils/transformError";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { EmptyState } from "../../../components/ui/EmptyState";
import { HelpHint } from "../../../components/ui/HelpHint";
import { CaBroadcastSection } from "./CaBroadcastSection";
import { ExamBroadcastSection } from "./ExamBroadcastSection";

type Section = "ca" | "exam";

export const BroadcastCenter = () => {
  const { formClassId, formClass, schoolName, isLoading: profileLoading } = useTeacherProfile();
  const { activeTerm, isLoading: termLoading } = useActiveTerm();
  const term = activeTerm?.term ?? "";

  const [section, setSection] = useState<Section>("ca");

  const statusQuery = useBroadcastStatus({ classId: formClassId ?? "", term });

  if (profileLoading || termLoading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
        </div>
      </div>
    );
  }

  if (!formClassId) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="bg-white rounded-xl border border-gray100 p-12 text-center">
          <Profile2User size={32} className="mx-auto text-gray300 mb-3" variant="Bold" />
          <p className="text-sm font-medium text-gray900">You're not assigned as a form teacher</p>
          <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
            Once you're assigned a form class, you'll be able to broadcast CA and exam results to parents here.
          </p>
        </div>
      </div>
    );
  }

  const subtitle = [schoolName, formClass, term ? termLabel(term).label : ""].filter(Boolean).join(" · ");

  const tabs: { id: Section; label: string; Icon: typeof StatusUp }[] = [
    { id: "ca", label: "Continuous Assessment", Icon: MedalStar },
    { id: "exam", label: "Examination", Icon: StatusUp },
  ];

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex flex-col gap-3 mb-4">
        <div className="group flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-bold text-gray900">Broadcast</h1>
          <HelpHint
            title="Broadcast"
            storageKey="broadcast-center"
            description="Share CA and exam results with parents of your class."
            sections={[
              { title: "Continuous Assessment", text: "Pick which mark types (Test 1, Test 2, Practical…) to include, then broadcast straight to parents — no approval needed." },
              { title: "Examination", text: "Submit the whole exam sheet for principal approval. Once approved it's sent to parents, and you can resend to individual students without another approval." },
              { title: "Missing scores", text: "Students with unmarked scores show badges here so you know what's left before broadcasting." },
            ]}
          />
        </div>
        <p className="text-xs md:text-sm text-gray500">{subtitle || formClass}</p>

        <div className="inline-flex w-fit items-center gap-1 rounded-full border border-input bg-card p-1 overflow-x-auto no-scrollbar max-w-full">
          {tabs.map(({ id, label, Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                  active ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
                )}
              >
                <Icon size={15} color={active ? "#FFFFFF" : "#8C8C8C"} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {statusQuery.isLoading ? (
        <div className="py-12">
          <SomaLoader label="Loading broadcast sheet" />
        </div>
      ) : statusQuery.error ? (
        <div className="bg-white rounded-xl border border-gray100 p-12 text-center">
          <p className="text-sm font-medium text-gray900">Couldn't load the broadcast sheet</p>
          <p className="text-xs text-gray500 mt-1">
            {transformError(statusQuery.error)}
          </p>
        </div>
      ) : statusQuery.data && statusQuery.data.students.length === 0 ? (
        <EmptyState
          className="min-h-[320px] border border-gray100 rounded-xl"
          icon={<Profile2User size={30} variant="Bold" color="#0D0D0D" />}
          title="No students yet"
          description={`Students added to ${formClass} will appear here once scores are saved.`}
        />
      ) : statusQuery.data ? (
        <>
          {section === "ca" && (
            <CaBroadcastSection status={statusQuery.data} scope={{ classId: formClassId, term }} />
          )}
          {section === "exam" && (
            <ExamBroadcastSection status={statusQuery.data} scope={{ classId: formClassId, term }} />
          )}
        </>
      ) : null}
    </div>
  );
};