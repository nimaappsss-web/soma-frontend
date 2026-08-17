import { useState } from "react";
import { Card, ArrowLeft2 } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { formatNaira } from "../../finance/utils/currency";
import { usePaystackCheckout } from "../../finance/api";
import type { Invoice } from "../../finance/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  invoice: Invoice & { outstanding: number };
}

const SURCHARGE_RATE = 0.015;
const SURCHARGE_FLAT = 100;

const computeSurcharge = (amount: number): number =>
  Math.round(amount * SURCHARGE_RATE) + SURCHARGE_FLAT;

export const PaystackModal = ({ open, onOpenChange, childName, invoice }: Props) => {
  const checkout = usePaystackCheckout();
  const [confirmed, setConfirmed] = useState(false);

  const surcharge = computeSurcharge(invoice.outstanding);
  const total = invoice.outstanding + surcharge;

  const handleProceed = () => {
    checkout.mutate(
      { invoiceId: invoice.id, amount: invoice.outstanding },
      {
        onSuccess: (data) => {
          window.location.href = data.authorizationUrl;
        },
      },
    );
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(() => setConfirmed(false), 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent variant="center" className="md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pay now with card</DialogTitle>
          <DialogDescription>
            Pay securely for {childName} — the school confirms automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {!confirmed ? (
            <>
              <div className="rounded-xl border border-gray-100 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">School fee</span>
                  <span className="text-gray900 font-medium">{formatNaira(invoice.outstanding)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Processing fee</span>
                  <span className="text-gray900 font-medium">+ {formatNaira(surcharge)}</span>
                </div>
                <div className="h-px bg-gray-100 my-1" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">You pay</span>
                  <span className="text-lg font-bold text-gray900">{formatNaira(total)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                A small processing fee ({SURCHARGE_RATE * 100}% + ₦{SURCHARGE_FLAT}) is charged by the
                payment provider — it's not collected by the school. You'll be taken to a secure
                checkout to complete payment.
              </p>

              <Button
                className="w-full rounded-full"
                onClick={() => setConfirmed(true)}
              >
                <Card size={15} color="#FFFFFF" />
                Continue to payment
              </Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={close}>
                <ArrowLeft2 size={14} color="#0D0D0D" />
                Back
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-gray-50 p-4 space-y-1.5">
                <p className="text-sm text-gray-400">You're about to pay</p>
                <p className="text-2xl font-bold text-gray900">{formatNaira(total)}</p>
                <p className="text-xs text-gray-400">({formatNaira(invoice.outstanding)} fee + {formatNaira(surcharge)} processing fee)</p>
              </div>
              <Button className="w-full rounded-full" onClick={handleProceed} disabled={checkout.isPending}>
                {checkout.isPending ? "Opening secure checkout…" : "Open secure checkout"}
              </Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={() => setConfirmed(false)}>
                <ArrowLeft2 size={14} color="#0D0D0D" />
                Back
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};