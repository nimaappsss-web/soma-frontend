import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useInviteTeacher, useGenerateInviteLink } from "../api";
import { inviteTeacherSchema, type InviteTeacherFormData } from "../utils/validationSchema";
import { cn } from "../../../lib/utils";

interface InviteTeacherModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "email" | "link";

export const InviteTeacherModal = ({ open, onClose }: InviteTeacherModalProps) => {
  const [tab, setTab] = useState<Tab>("email");
  const inviteMutation = useInviteTeacher();
  const generateMutation = useGenerateInviteLink();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteTeacherFormData>({
    resolver: zodResolver(inviteTeacherSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: InviteTeacherFormData) => {
    inviteMutation.mutate(
      { teacherEmail: data.email, role: "TEACHER" },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  const handleGenerate = () => {
    generateMutation.mutate(
      { role: "TEACHER" },
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
    setTab("email");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent variant="middle" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Teacher</DialogTitle>
          <DialogDescription>
            Invite a teacher by email, or generate a shareable link.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="flex gap-1 mb-4 rounded-lg bg-gray-100 p-1 text-sm">
            <button
              onClick={() => setTab("email")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-center font-medium transition-colors",
                tab === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
              )}
            >
              By Email
            </button>
            <button
              onClick={() => setTab("link")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-center font-medium transition-colors",
                tab === "link" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
              )}
            >
              Shareable Link
            </button>
          </div>

          {tab === "email" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {inviteMutation.isError && (
                <p className="text-sm text-destructive">
                  {(inviteMutation.error as Error)?.message}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="teacher-email">Email Address</Label>
                <Input
                  id="teacher-email"
                  type="email"
                  placeholder="teacher@school.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} className="w-full">
                  Cancel
                </Button>
                <button type="submit" disabled={inviteMutation.isPending} className="w-full">
                  {inviteMutation.isPending ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          )}

          {tab === "link" && (
            <div className="space-y-4">
              {generateMutation.isError && (
                <p className="text-sm text-destructive">
                  {(generateMutation.error as Error)?.message}
                </p>
              )}

              {generatedLink ? (
                <div className="space-y-3">
                  <div className="rounded-md border bg-gray-50 p-3">
                    <p className="text-xs text-gray-400 mb-1">Share this link with the teacher:</p>
                    <p className="text-sm break-all text-gray-800">{generatedLink}</p>
                  </div>
                  <Button onClick={handleCopy} variant="outline" className="w-full">
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClose} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    Generate a link that teachers can use to set up their own account. The link stays
                    active for 30 days and works for multiple teachers.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handleClose} className="w-full">
                      Cancel
                    </Button>
                    <button
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending}
                      className="w-full"
                    >
                      {generateMutation.isPending ? "Generating..." : "Generate Link"}
                    </button>
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
