export type PromotionAction = "PROMOTE" | "REPEAT" | "GRADUATE";

export interface ClassMovePayload {
  fromClassId: string;
  toClassId: string;
}

export interface PromotionOverridePayload {
  studentId: string;
  action: PromotionAction;
  toClassId?: string;
}

export interface PromoteStudentsPayload {
  moves: ClassMovePayload[];
  overrides: PromotionOverridePayload[];
}

export interface PromoteStudentsResponse {
  promoted: number;
  repeated: number;
  graduated: number;
}

export interface RolloverTermInput {
  term: "first" | "second" | "third";
  startDate: string;
  endDate: string;
}

export interface RolloverTerm {
  id: string;
  term: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface SessionRolloverPayload {
  terms: RolloverTermInput[];
}

export interface SessionRolloverResponse {
  terms: RolloverTerm[];
}

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};
