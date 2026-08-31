import { useState } from "react";
import { TickCircle, ArrowLeft2 } from "iconsax-react";

import { cn } from "@/lib/utils";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { MoneyInput } from "../../finance/components/MoneyInput";
import { formatNaira } from "../../finance/utils/currency";
import { useSubmitParentPayment } from "../api/useSubmitParentPayment";
import { useSchoolSettings } from "../../settings/api";
import type { ManualBankDetails } from "../../settings/types";

interface InvoiceTarget {
  id: string;
  studentId: string;
  amount: number;
  outstanding: number;
  feeName: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  invoice: InvoiceTarget;
}

type Step = "guide" | "reference" | "amount" | "confirm" | "done";

const APP_GUIDES: { app: string; steps: string[] }[] = [
  {
    app: "Palmpay",
    steps: [
      "Open Palmpay and go to the home screen.",
      "Tap the three lines (menu) or the profile icon at the top.",
      "Tap “Transactions” or “History”.",
      "Your transaction ID is the long number shown for the transfer.",
    ],
  },
  {
    app: "OPay",
    steps: [
      "Open OPay and tap the profile icon at the top left.",
      "Tap “Transaction History”.",
      "Tap the transfer you made to the school.",
      "The transaction ID is the reference shown at the top of that screen.",
    ],
  },
  {
    app: "Moniepoint",
    steps: [
      "Open Moniepoint and tap “Transactions” at the bottom.",
      "Tap the outgoing transfer to the school.",
      "Your transaction ID is the reference number under the amount.",
    ],
  },
  {
    app: "Bank app",
    steps: [
      "Open your bank's app and go to “History” or “Transactions”.",
      "Find the transfer you made to the school.",
      "The transaction ID is the reference or narration number shown.",
    ],
  },
];

export const PaymentSubmitModal = ({ open, onOpenChange, childName, invoice }: Props) => {
  const [step, setStep] = useState<Step>("guide");
  const [guideApp, setGuideApp] = useState("Palmpay");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(0);
  const submitMutation = useSubmitParentPayment();
  const { data: settings } = useSchoolSettings();
  const bankSetting = settings?.find((s) => s.key === "manualBankDetails");
  const bank = (bankSetting?.value as ManualBankDetails | null) ?? null;
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const amountNum = amount || 0;
  const amountClamped = amountNum > invoice.outstanding;
  const sendAmount = Math.min(amountNum, invoice.outstanding);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("guide");
      setReference("");
      setAmount(0);
    }, 200);
  };

  const handleConfirm = () => {
    submitMutation.mutate(
      {
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        amount: sendAmount,
        method: "TRANSFER",
        reference: reference.trim() || undefined,
      },
      { onSuccess: () => setStep("done") },
    );
  };

  const guide = APP_GUIDES.find((g) => g.app === guideApp) ?? APP_GUIDES[0];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent variant="center" className="md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "done" ? "Payment sent" : `Pay fees for ${childName}`}
          </DialogTitle>
          <DialogDescription>
            {step === "done"
              ? "Your school will confirm your payment shortly."
              : step === "confirm"
                ? "Check everything looks right before sending."
                : "A few quick steps — it takes less than a minute."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {step === "guide" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                {bank?.accountNumber && (
                  <div className="rounded-xl border border-gray-100 bg-white p-4 mb-4">
                    <p className="text-xs font-medium text-gray900">Pay to</p>
                    <div className="mt-2 space-y-2">
                      {bank.accountName && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-gray-400">Account name</span>
                          <span className="text-xs font-medium text-gray900 text-right">{bank.accountName}</span>
                        </div>
                      )}
                      {bank.bankName && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-gray-400">Bank</span>
                          <span className="text-xs font-medium text-gray900 text-right">{bank.bankName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400">Account number</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray900 tracking-widest">{bank.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => copy(bank.accountNumber!)}
                            className="text-[11px] font-medium text-gray-400 hover:text-gray900"
                          >
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm font-medium text-gray900 mb-2">How to pay</p>
                <ol className="space-y-2 text-sm text-gray500">
                  <li className="flex gap-2"><span className="text-gray900 font-medium shrink-0">1.</span> Send the money to the school's account{bank?.accountNumber ? " below" : ""} from any bank or wallet app.</li>
                  <li className="flex gap-2"><span className="text-gray900 font-medium shrink-0">2.</span> Copy the transaction ID from your app.</li>
                  <li className="flex gap-2"><span className="text-gray900 font-medium shrink-0">3.</span> Come back here and type it in below.</li>
                </ol>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray900 mb-2">Where do I find my transaction ID?</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {APP_GUIDES.map((g) => (
                    <button
                      key={g.app}
                      type="button"
                      onClick={() => setGuideApp(g.app)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        guideApp === g.app ? "bg-gray900 text-white" : "bg-gray50 text-gray500 hover:bg-accent",
                      )}
                    >
                      {g.app}
                    </button>
                  ))}
                </div>
                <ol className="space-y-2 text-sm text-gray500">
                  {guide.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gray900 font-medium shrink-0">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>

              <Button className="w-full rounded-full" onClick={() => setStep("reference")}>
                I've made the transfer
              </Button>
            </div>
          )}

          {step === "reference" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray900">Transaction ID</p>
                <Input
                  type="text"
                  placeholder="e.g. 2348 5491 2231 7748"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-gray-400">
                  You'll find this in your bank or wallet app. It's how the school matches your payment.
                </p>
              </div>
              <Button
                className="w-full rounded-full"
                onClick={() => setStep("amount")}
                disabled={!reference.trim()}
              >
                Continue
              </Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={() => setStep("guide")}>
                <ArrowLeft2 size={14} color="#0D0D0D" />
                Back
              </Button>
            </div>
          )}

          {step === "amount" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray900">Amount you paid (₦)</p>
                <MoneyInput
                  value={amountNum}
                  onChange={setAmount}
                  autoFocus
                />
                <p className="text-xs text-gray-400">
                  Still to pay: <span className="text-gray900 font-medium">{formatNaira(Math.max(0, invoice.outstanding - sendAmount))}</span>
                </p>
                {amountClamped && (
                  <p className="text-xs text-amber-600">
                    This is more than what's left — we'll record it as {formatNaira(sendAmount)}.
                  </p>
                )}
              </div>
              <Button
                className="w-full rounded-full"
                onClick={() => setStep("confirm")}
                disabled={amountNum <= 0}
              >
                Review
              </Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={() => setStep("reference")}>
                <ArrowLeft2 size={14} color="#0D0D0D" />
                Back
              </Button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Student</span>
                  <span className="text-gray900 font-medium">{childName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Fee</span>
                  <span className="text-gray900 font-medium">{invoice.feeName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-gray900 font-semibold">{formatNaira(sendAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Transaction ID</span>
                  <span className="text-gray900 font-medium truncate pl-3">{reference.trim()}</span>
                </div>
              </div>
              <p className="text-sm text-gray500">
                You paid <span className="font-semibold text-gray900">{formatNaira(sendAmount)}</span> for {childName}. Correct?
              </p>
              <Button
                className="w-full rounded-full"
                onClick={handleConfirm}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Sending…" : "Yes, send it"}
              </Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={() => setStep("amount")}>
                <ArrowLeft2 size={14} color="#0D0D0D" />
                Edit
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <TickCircle size={28} variant="Bold" color="#34A853" />
                </div>
                <p className="text-sm font-medium text-gray900">
                  Payment sent — waiting for the school to confirm.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  You'll see it change to “Confirmed ✓” here once the school verifies it.
                </p>
              </div>
              <Button className="w-full rounded-full" onClick={close}>
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};