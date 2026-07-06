import { useState } from "react";
import { Modal } from "../../../components/others/Modal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { useInviteTeacher } from "../api";

interface InviteTeacherModalProps {
  open: boolean;
  onClose: () => void;
}

export const InviteTeacherModal = ({ open, onClose }: InviteTeacherModalProps) => {
  const [email, setEmail] = useState("");
  const inviteMutation = useInviteTeacher();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(
      { teacherEmail: email, role: "TEACHER" },
      {
        onSuccess: () => {
          setEmail("");
          onClose();
        },
      },
    );
  };

  return (
    <Modal showDialog={open} closeModal={onClose} variant="middle">
      <Card className="mx-4 mt-12 sm:mx-auto sm:max-w-md">
        <CardHeader>
          <CardTitle>Invite Teacher</CardTitle>
          <CardDescription>
            Enter the teacher's email address. They'll receive an email with instructions to set up their account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.com"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending} className="w-full">
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Modal>
  );
};
