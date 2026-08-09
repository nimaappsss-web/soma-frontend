import { useState, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft2 } from "iconsax-react";

import { useAuth } from "../../contexts/AuthContext";
import { useTeacherProfile, useAttendanceAvailability } from "../../features/teacher/api";
import { useCalendarEvents } from "../../features/calendar/api";
import { useStudents } from "../../features/students/api";
import { AttendanceListView } from "../../features/teacher/components/AttendanceListView";
import { AttendanceHistoryView } from "../../features/teacher/components/AttendanceHistoryView";
import { StudentSwipeCard } from "../../components/ui/StudentSwipeCard";
import { Textarea } from "../../components/ui/textarea";
import { addToQueue } from "../../sync/syncQueue";
import { db } from "../../db/db";
import { fetchData } from "../../utils/fetchData";
import { localDateKey } from "../../utils/date";
import { Button } from "../../components/ui/button";
import type { AttendanceStatus, AttendanceRecord as ApiAttendanceRecord } from "../../features/teacher/types";
import type { AttendanceQueryResponse } from "../../features/teacher/types";

type Tab = "mark" | "history";
type ViewMode = "list" | "card";

export const TeacherAttendance = () => {
  const { user } = useAuth();
  const { formClass, formClassId, isLoading: profileLoading } = useTeacherProfile();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = tabParam === "history" ? "history" : "mark";
  const today = localDateKey();
  const [view, setView] = useState<ViewMode>("list");

  const handleTabChange = (newTab: Tab) => {
    if (newTab === "mark") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: "history" });
    }
  };

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [clearConfirm, setClearConfirm] = useState(false);
  const [modifyMode, setModifyMode] = useState(false);
  const [userMarked, setUserMarked] = useState(false);
  const [dayNote, setDayNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);

  const initialized = useRef(false);

  const { data: students, isLoading: studentsLoading } = useStudents(formClassId ?? "", "ACTIVE");

  const availability = useAttendanceAvailability(today);
  const { data: todayEventsData } = useCalendarEvents({ from: today, to: today });
  const todayEvents = (todayEventsData?.events ?? []).filter(
    (e) => e.type !== "HOLIDAY" && e.date.slice(0, 10) === today,
  );

  const blockedReason = availability.reason?.message;
  const gatingBlocked = availability.status === "blocked";
  const gatingLoading = availability.status === "loading";

  const cachedAttendance = useLiveQuery(
    () => {
      if (!formClassId || !user?.id) return Promise.resolve([] as import("../../db/db").AttendanceRecord[]);
      return db.attendance.where("[userId+date+className]").equals([user.id, today, formClass ?? ""]).toArray();
    },
    [formClassId, today, formClass, user?.id],
  );

  const cachedNote = useLiveQuery(
    () => {
      if (!formClassId || !user?.id) return Promise.resolve(undefined as import("../../db/db").AttendanceNote | undefined);
      return db.attendanceNotes.where("[userId+date+className]").equals([user.id, today, formClass ?? ""]).first();
    },
    [formClassId, today, formClass, user?.id],
  );

  useQuery({
    queryKey: ["attendance", formClassId, today],
    queryFn: async () => {
      if (!formClassId) throw new Error("no class");
      const res = await fetchData<AttendanceQueryResponse>(
        `/attendance?classId=${formClassId}&date=${today}`,
        "GET",
      );
      if (res.records?.length) {
        const hasPending = await db.attendance
          .where("[userId+date+className]").equals([user!.id, today, formClass ?? ""])
          .filter((r) => r.syncStatus === "pending")
          .count();
        if (hasPending === 0) {
          await db.transaction("rw", db.attendance, async () => {
            await db.attendance
              .where("[userId+date+className]").equals([user!.id, today, formClass ?? ""])
              .delete();
            await db.attendance.bulkPut(
              (res.records as ApiAttendanceRecord[]).map((r) => ({
                id: r.id,
                userId: user!.id,
                studentId: r.studentId,
                className: formClass ?? "",
                schoolId: user?.schoolId ?? "",
                status: r.status,
                date: today,
                syncStatus: "synced" as const,
                createdAt: Date.now(),
              })),
            );
          });
        }
      }
      return res;
    },
    enabled: !!formClassId,
    staleTime: 5 * 60 * 1000,
  });

  const hasSavedData = (cachedAttendance ?? []).length > 0;
  const isMarked = userMarked || hasSavedData;

  if (!initialized.current && hasSavedData && !userMarked) {
    initialized.current = true;
    const prefill: Record<string, AttendanceStatus> = {};
    for (const r of cachedAttendance ?? []) {
      prefill[r.studentId] = r.status;
    }
    setAttendance(prefill);
    if (cachedNote?.note) {
      setDayNote(cachedNote.note);
      setNoteOpen(true);
    }
  }

  const handleMark = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => {
      if (prev[studentId] === status) {
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: status };
    });
  };

  const handleUndo = (studentId: string) => {
    setAttendance((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleSave = async () => {
    if (!formClassId || gatingBlocked || gatingLoading || Object.keys(attendance).length === 0) return;
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId, status,
    }));

    const queueId = `attendance_${formClassId}_${today}`;
    await addToQueue({
      userId: user!.id,
      table: "attendance",
      recordId: queueId,
      endpoint: "/attendance/bulk",
      method: "POST",
      payload: { classId: formClassId, date: today, records, note: dayNote.trim() },
    });

    await db.attendance.bulkPut(
      records.map((r) => ({
        id: `att_${formClassId}_${today}_${r.studentId}`,
        userId: user!.id,
        studentId: r.studentId,
        className: formClass ?? "",
        schoolId: user?.schoolId ?? "",
        status: r.status,
        date: today,
        syncStatus: "pending" as const,
        createdAt: Date.now(),
      })),
    );

    const noteId = `note_${user!.id}_${formClassId}_${today}`;
    const trimmed = dayNote.trim();
    if (trimmed) {
      await db.attendanceNotes.put({
        id: noteId,
        userId: user!.id,
        className: formClass ?? "",
        date: today,
        note: trimmed,
        createdAt: Date.now(),
      });
    } else {
      await db.attendanceNotes.delete(noteId);
    }

    setModifyMode(false);
    setUserMarked(true);
  };

  const handleModify = () => {
    setModifyMode(true);
    setView("list");
    if (cachedAttendance?.length) {
      const prefill: Record<string, AttendanceStatus> = {};
    for (const r of cachedAttendance ?? []) {
        prefill[r.studentId] = r.status;
      }
      setAttendance(prefill);
    }
  };

  const handleClearAll = async () => {
    if (!formClassId || gatingBlocked || gatingLoading) return;

    await db.attendance
      .where("[userId+date+className]").equals([user!.id, today, formClass ?? ""])
      .delete();

    await db.syncQueue
      .where("userId").equals(user!.id)
      .filter((i) => i.table === "attendance" && (i.status === "pending" || i.status === "failed"))
      .delete();

    await db.attendanceNotes.delete(`note_${user!.id}_${formClassId}_${today}`);

    await addToQueue({
      userId: user!.id,
      table: "attendance",
      recordId: `attendance_clear_${formClassId}_${today}`,
      endpoint: "/attendance/bulk",
      method: "DELETE",
      payload: { classId: formClassId, date: today },
    });

    setClearConfirm(false);
    setModifyMode(false);
    setAttendance({});
    setDayNote("");
    setNoteOpen(false);
    setUserMarked(false);
  };

  const sortedStudents = useMemo(
    () => [...(students ?? [])].sort((a, b) => {
      const na = a.name?.toLowerCase() ?? "";
      const nb = b.name?.toLowerCase() ?? "";
      return na < nb ? -1 : na > nb ? 1 : 0;
    }),
    [students],
  );

  if (profileLoading) {
    return <p className="text-sm text-gray-400 p-8">Loading...</p>;
  }

  if (!formClass) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">You are not a class teacher.</p>
        <Link
          to="/teach"
          aria-label="Back to Dashboard"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
        >
          <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
        </Link>
      </div>
    );
  }

  const markedCount = Object.keys(attendance).length;
  const totalStudents = students?.length ?? 0;

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray900">
            Attendance — {formClass}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {tab === "history" ? "View history" : isMarked && !modifyMode ? "Marked for today" : `${markedCount} / ${totalStudents} marked`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => handleTabChange("mark")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === "mark" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
              }`}
            >
              Mark
            </button>
            <button
              onClick={() => handleTabChange("history")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === "history" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {tab === "history" ? (
        formClassId ? (
          <AttendanceHistoryView classId={formClassId} formClass={formClass} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No class assigned.</p>
        )
      ) : gatingLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md mx-auto text-center">
          <div className="text-3xl mb-3">🗓️</div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Checking today</h3>
          <p className="text-xs text-gray-400">Confirming whether today is a school day…</p>
        </div>
      ) : gatingBlocked ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md mx-auto text-center">
          <div className="text-3xl mb-3">📅</div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Attendance not available today</h3>
          <p className="text-sm text-gray-500 mb-4">
            {blockedReason ?? "This is not a school day."}
          </p>
          {todayEvents.length > 0 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-left mb-2">
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1">Also scheduled</p>
              {todayEvents.map((e) => (
                <p key={e.id} className="text-xs text-gray-600">{e.title}</p>
              ))}
            </div>
          )}
          <p className="text-[11px] text-gray-400">
            Attendance can only be marked on school days.
          </p>
        </div>
      ) : isMarked && !modifyMode ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-green-600 font-medium">
              {markedCount} students marked for today
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={handleModify} variant="outline" size="sm">
                Modify
              </Button>
              {clearConfirm ? (
                <div className="flex gap-2">
                  <Button onClick={handleClearAll} variant="destructive" size="sm" className="flex-1">
                    Yes, clear all
                  </Button>
                  <Button onClick={() => setClearConfirm(false)} variant="ghost" size="sm" className="flex-1">
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setClearConfirm(true)}
                  className="text-xs text-red-400 hover:text-red-600 py-2 transition-colors"
                >
                  Clear all attendance for today
                </button>
              )}
            </div>
          </div>
          {dayNote && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Note for today</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{dayNote}</p>
            </div>
          )}
          <AttendanceListView
            students={sortedStudents}
            attendance={attendance}
            onMark={handleMark}
            readOnly
          />
        </div>
      ) : studentsLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading students...</p>
        </div>
      ) : !students || students.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-gray-400">No students in this class yet.</p>
          <Link
            to="/teach/students"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            View Students
          </Link>
        </div>
      ) : (
        <>
          {todayEvents.length > 0 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-2.5 mb-4">
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-0.5">
                Event today
              </p>
              {todayEvents.map((e) => (
                <p key={e.id} className="text-xs text-gray-700">{e.title}</p>
              ))}
            </div>
          )}
          <div className="mb-4">
            {!noteOpen ? (
              <button
                onClick={() => setNoteOpen(true)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 py-2 transition-colors flex items-center gap-1.5"
              >
                <span className="text-sm leading-none">+</span> Add a note for today
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <Textarea
                  value={dayNote}
                  onChange={(e) => setDayNote(e.target.value)}
                  placeholder="Optional note for today (e.g. exam day, low turnout…)"
                  rows={2}
                  className="rounded-xl bg-gray-50 border-gray-100"
                />
                <div className="flex items-center justify-end mt-2 gap-3">
                  {dayNote && (
                    <button
                      onClick={() => { setDayNote(""); setNoteOpen(false); }}
                      className="text-xs text-gray-400 hover:text-red-500 py-1 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    onClick={() => setNoteOpen(false)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 py-1 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
          {view === "list" && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleSave}
                disabled={markedCount === 0}
              >
                Save ({markedCount})
              </button>
            </div>
          )}

          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-700"
              }`}
            >
              List View
            </button>
            {!isMarked && (
              <button
                onClick={() => setView("card")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === "card" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-700"
                }`}
              >
                Card View
              </button>
            )}
          </div>

          {view === "card" ? (
            <StudentSwipeCard
              students={sortedStudents}
              onSwipe={(studentId, status) => handleMark(studentId, status)}
              onUndo={handleUndo}
              onSave={handleSave}
              markedCount={markedCount}
              totalStudents={totalStudents}
            />
          ) : (
            <AttendanceListView
              students={sortedStudents}
              attendance={attendance}
              onMark={handleMark}
            />
          )}
        </>
      )}
    </div>
  );
};
