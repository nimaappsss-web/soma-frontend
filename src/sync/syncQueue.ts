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
  await db.syncQueue.add({
    ...item,
    status: "pending",
    createdAt: Date.now(),
    retryCount: 0,
  });
};

export const getPendingCount = async () => {
  return db.syncQueue.where("status").equals("pending").count();
};

export const getFailedCount = async () => {
  return db.syncQueue.where("status").equals("failed").count();
};
