import { db } from "../db/db";

interface AddToQueueInput {
  userId: string;
  table: string;
  recordId: string;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload: unknown;
}

export const addToQueue = async (item: AddToQueueInput) => {
  const existing = await db.syncQueue
    .where("userId")
    .equals(item.userId)
    .filter((i) => i.table === item.table && i.recordId === item.recordId && (i.status === "pending" || i.status === "failed"))
    .first();

  if (existing) {
    await db.syncQueue.update(existing.id!, {
      payload: item.payload,
      status: "pending",
      retryCount: 0,
      createdAt: Date.now(),
    });
  } else {
    await db.syncQueue.add({
      ...item,
      status: "pending",
      createdAt: Date.now(),
      retryCount: 0,
    });
  }
};

export const getPendingCount = async () => {
  return db.syncQueue.where("status").equals("pending").count();
};

export const getFailedCount = async () => {
  return db.syncQueue.where("status").equals("failed").count();
};
