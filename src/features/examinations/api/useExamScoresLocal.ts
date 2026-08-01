import { useEffect, useState } from "react";
import { Dexie } from "dexie";

import { db, type ExamScoreCache } from "../../../db/db";

export const examScoreKey = ({
  subjectId,
  classId,
  componentId,
  term,
}: {
  subjectId: string;
  classId: string;
  componentId: string;
  term: string;
}) => `${subjectId}:${classId}:${componentId}:${term}`;

export const useExamScoresLocal = (examKey: string) => {
  const [scores, setScores] = useState<ExamScoreCache[]>([]);
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useEffect(() => {
    setReadyKey(null);
    setScores([]);

    if (!examKey) {
      setReadyKey("");
      return;
    }

    let alive = true;
    const subscription = Dexie.liveQuery(() =>
      db.examScores.where("examKey").equals(examKey).toArray(),
    ).subscribe(
      (rows: ExamScoreCache[]) => {
        if (!alive) return;
        setScores(rows);
        setReadyKey(examKey);
      },
      () => {},
    );

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [examKey]);

  return {
    scores,
    isLoading: readyKey !== examKey,
  };
};
