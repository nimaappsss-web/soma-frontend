export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "TRANSFER" | "POS" | "ONLINE";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface FeeItem {
  id: string;
  label: string;
  amount: number;
}

export interface FeeStructure {
  id: string;
  classIds: string[];
  classNames?: string[];
  term: string;
  session: string;
  name: string;
  amount: number;
  items?: FeeItem[];
  isCompulsory: boolean;
  createdAt?: string;
}

export interface FeeStructureListResponse {
  feeStructures: FeeStructure[];
}

export interface CreateFeeStructurePayload {
  classIds: string[];
  term: string;
  session: string;
  name: string;
  isCompulsory: boolean;
  items: FeeItem[];
}

export interface UpdateFeeStructurePayload {
  name?: string;
  isCompulsory?: boolean;
  items?: FeeItem[];
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
  feeStructureId?: string;
  feeName?: string;
  groupId?: string;
  items?: FeeItem[];
  amount: number;
  status: InvoiceStatus;
  term?: string;
  session?: string;
  dueDate: string | null;
  issuedByName?: string | null;
  createdAt: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SchoolLetterhead {
  name: string;
  logo: string | null;
  address: string | null;
  state: string | null;
  lga: string | null;
  schoolCode: string | null;
}

export interface InvoiceDetail {
  id: string;
  amount: number;
  items: FeeItem[];
  status: InvoiceStatus;
  term: string;
  session: string;
  feeName: string;
  groupId: string;
  dueDate: string | null;
  createdAt: string;
  issuedByName: string | null;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    className: string;
  };
  school: SchoolLetterhead;
  signatory: { name: string; title: string };
}

export interface GenerateInvoicePayload {
  studentId: string;
  feeStructureId: string;
  amount: number;
}

export interface BulkGeneratePayload {
  classId?: string;
  classIds?: string[];
  term?: string;
  session?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  status: PaymentStatus;
  submittedAt: string | null;
  confirmedAt: string | null;
  rejectedReason: string | null;
  invoiceAmount?: number;
  invoiceStatus?: InvoiceStatus;
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
  status?: PaymentStatus;
}

export interface FinanceSummary {
  totalExpected: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number;
  byClass: Array<{ className: string; expected: number; collected: number; outstanding: number }>;
  recentPayments: Array<{ date: string; studentName: string; amount: number; method: PaymentMethod }>;
}
