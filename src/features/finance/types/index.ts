export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "TRANSFER" | "POS" | "ONLINE";

export interface FeeStructure {
  id: string;
  classId: string;
  term: string;
  session: string;
  name: string;
  amount: number;
  isCompulsory: boolean;
}

export interface FeeStructureListResponse {
  feeStructures: FeeStructure[];
}

export interface CreateFeeStructurePayload {
  classId: string;
  term: string;
  session: string;
  name: string;
  amount: number;
  isCompulsory: boolean;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string | null;
  createdAt: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GenerateInvoicePayload {
  studentId: string;
  feeStructureId: string;
  amount: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  createdAt: string;
}

export interface PaymentListResponse {
  payments: Payment[];
}

export interface RecordPaymentPayload {
  invoiceId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

export interface FinanceSummary {
  totalExpected: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number;
  byClass: Array<{ className: string; expected: number; collected: number; outstanding: number }>;
  recentPayments: Array<{ date: string; studentName: string; amount: number; method: PaymentMethod }>;
}
