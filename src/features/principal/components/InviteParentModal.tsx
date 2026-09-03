import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { ErrorMessage } from "../../../components/others/ErrorMessage";
import { EmailLookupBadge } from "../../../components/others/EmailLookupBadge";
import { transformError } from "../../../utils/transformError";
import { SelectDropdown, type SelectOption } from "../../../components/ui/select-dropdown";
import { useInviteParent } from "../api/useInviteParent";
import { useAllStudents } from "../../students/api/useAllStudents";
import { useAuth } from "../../../contexts/AuthContext";
import { useEmailLookup } from "../../../hooks/useEmailLookup";

const schema = z.object({
  name: z.string().min(2, "Parent name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface InviteParentModalProps {
  open: boolean;
  onClose: () => void;
}

export const InviteParentModal = ({ open, onClose }: InviteParentModalProps) => {
  const { user } = useAuth();
  const { data: students } = useAllStudents(user?.id ?? "");
  const inviteMutation = useInviteParent();
  const [studentId, setStudentId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const email = watch("email") ?? "";
  const { result: emailResult } = useEmailLookup(email, user?.id ?? "", user?.email);
  const emailTaken = !!emailResult?.found && emailResult.type === "staff";

  const studentOptions: SelectOption[] = (students ?? []).map((s) => ({
    value: s.id,
    label: `${s.name}${s.admissionNo ? ` (${s.admissionNo})` : ""}`,
  }));

  const onSubmit = (data: FormData) => {
    if (!studentId) return;
    if (emailTaken) return;
    inviteMutation.mutate(
      {
        name: data.name,
        email: data.email,
        studentId,
        phone: data.phone || undefined,
      },
      {
        onSuccess: () => {
          reset();
          setStudentId("");
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    reset();
    setStudentId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent variant="middle" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Parent</DialogTitle>
          <DialogDescription>
            Send a parent a setup link so they can follow their child's progress.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {inviteMutation.isError && (
              <ErrorMessage>{transformError(inviteMutation.error)}</ErrorMessage>
            )}

            <div className="space-y-2">
              <Label htmlFor="parent-name">Parent Name</Label>
              <Input
                id="parent-name"
                placeholder="e.g. Mrs Adebayo"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-email">Email Address</Label>
              <Input
                id="parent-email"
                type="email"
                placeholder="parent@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
              {emailResult && emailResult.found && (
                <EmailLookupBadge result={emailResult} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-phone">Phone (optional)</Label>
              <Input
                id="parent-phone"
                type="tel"
                placeholder="08123456789"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Link to Child</Label>
              <SelectDropdown
                options={studentOptions}
                value={studentId}
                onChange={setStudentId}
                placeholder="Select a student"
                searchable
              />
              {!studentId && (
                <p className="text-sm text-destructive">Select the child this parent follows</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteMutation.isPending || !studentId || emailTaken}
                className="w-full"
              >
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};