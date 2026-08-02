import { db, type ExamTermResultsCache } from "../../../db/db";
import type { TermResultsResponse } from "../types";

const cacheId = (userId: string, classId: string, term: string, session: string) =>
  `${userId}:${classId}:${term}:${session}`;

/**
 * Caches a term-results document (per class + term + session) for offline reads.
 * Read-only data, so the whole document is rewritten on every successful fetch.
 */
export const seedTermResults = async (
  userId: string,
  classId: string,
  term: string,
  session: string,
  results: TermResultsResponse,
) => {
  const row: ExamTermResultsCache = {
    id: cacheId(userId, classId, term, session),
    userId,
    classId,
    term,
    session,
    resultsJson: JSON.stringify(results),
    updatedAt: Date.now(),
  };
  await db.examTermResults.put(row);
};
