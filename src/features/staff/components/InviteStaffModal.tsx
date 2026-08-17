import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { ErrorMessage } from "../../../components/others/ErrorMessage";
import { transformError } from "../../../utils/transformError";
import { useInviteStaff } from "../api";
import { useGenerateInviteLink } from "../../principal/api";
import { cn } from "../../../lib/utils";

interface InviteStaffModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "email" | "link";

const ROLE_OPTIONS = [
  { value: "STAFF", label: "Staff" },
  { value: "BURSAR", label: "Bursar" },
];

const inviteFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

export const InviteStaffModal = ({ open, onClose }: InviteStaffModalProps) => {
  const [tab, setTab] = useState<Tab>("email");
  const [role, setRole] = useState<string>("STAFF");
  const inviteMutation = useInviteStaff();
  const generateMutation = useGenerateInviteLink();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(
      { name: data.name, email: data.email, phone: data.phone ?? "", role, department: "", designation: "" },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  const handleGenerate = () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setNetworkError("You need a network connection to generate the link.");
      return;
    }
    setNetworkError(null);
    generateMutation.mutate(
      { role },
      {
        onSuccess: (res) => {
          setGeneratedLink(res.link);
        },
      },
    );
  };

  const handleCopy = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setGeneratedLink(null);
    setCopied(false);
    setNetworkError(null);
    setTab("email");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent variant="middle" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Invite a non-teaching staff member by email, or generate a shareable link.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="flex w-fit items-center gap-1 mb-4 rounded-[15px] border border-input bg-background p-1">
            <button
              onClick={() => setTab("email")}
              className={cn(
                "flex h-8 items-center justify-center rounded-[10px] px-3 text-sm font-medium transition-colors",
                tab === "email" ? "bg-gray900 text-white" : "text-gray500 hover:text-gray700",
              )}
            >
              By Email
            </button>
            <button
              onClick={() => setTab("link")}
              className={cn(
                "flex h-8 items-center justify-center rounded-[10px] px-3 text-sm font-medium transition-colors",
                tab === "link" ? "bg-gray900 text-white" : "text-gray500 hover:text-gray700",
              )}
            >
              Shareable Link
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="staff-role">Role</Label>
            <SelectDropdown
              options={ROLE_OPTIONS}
              value={role}
              onChange={(val) => {
                setRole(val);
              }}
            />
            <p className="text-xs text-gray-400">
              Bursars get access to the Finance module to confirm and record payments.
            </p>
          </div>

          {tab === "email" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {inviteMutation.isError && (
                <ErrorMessage>{transformError(inviteMutation.error)}</ErrorMessage>
              )}

              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name</Label>
                <Input
                  id="staff-name"
                  type="text"
                  placeholder="e.g. Amina Yusuf"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-email">Email Address</Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="staff@school.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone (optional)</Label>
                <Input
                  id="staff-phone"
                  type="tel"
                  placeholder="08012345678"
                  {...register("phone")}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} className="w-full">
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending} className="w-full">
                  {inviteMutation.isPending ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>
          )}

          {tab === "link" && (
            <div className="space-y-4">
              {(generateMutation.isError || networkError) && (
                <ErrorMessage>{networkError ?? transformError(generateMutation.error)}</ErrorMessage>
              )}

              {generatedLink ? (
                <div className="space-y-3">
                  <div className="rounded-md border bg-gray-50 p-3">
                    <p className="text-xs text-gray-400 mb-1">Share this link with the team member:</p>
                    <p className="text-sm break-all text-gray-800">{generatedLink}</p>
                  </div>
                  <Button onClick={handleCopy} className="w-full">
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClose} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    Generate a link that team members can use to set up their own account. The link
                    stays active for 30 days.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handleClose} className="w-full">
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending}
                      className="w-full"
                    >
                      {generateMutation.isPending ? "Generating..." : "Generate Link"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};