import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

import { authApi } from "../services/auth";
import { useAcceptInvite } from "../features/principal/api";
import { useAuth } from "../contexts/AuthContext";
import { getPostAuthPath } from "../features/auth/utils/routing";
import type { InviteInfo } from "../features/principal/types";
import { MultiSelect, type SelectOption } from "../components/ui/multi-select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

interface AssignmentRow {
  subjectId: string;
  classIds: string[];
}

export const VerifyTeacher = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const acceptMutation = useAcceptInvite();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [infoError, setInfoError] = useState("");
  const [infoLoading, setInfoLoading] = useState(true);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [assignments, setAssignments] = useState<AssignmentRow[]>([
    { subjectId: "", classIds: [] },
  ]);

  useEffect(() => {
    if (!token) {
      setInfoError("No invitation token found in URL.");
      setInfoLoading(false);
      return;
    }
    authApi
      .getInviteInfo(token)
      .then((info) => {
        setInviteInfo(info);
        setInfoLoading(false);
      })
      .catch(() => {
        setInfoError("Invalid or expired invitation link.");
        setInfoLoading(false);
      });
  }, [token]);

  const subjectOptions: SelectOption[] =
    inviteInfo?.subjects.map((s) => ({ value: s.id, label: s.name })) || [];
  const classOptions: SelectOption[] =
    inviteInfo?.classes.map((c) => ({ value: c.id, label: c.name })) || [];

  const handleAddSubject = () => {
    setAssignments((prev) => [...prev, { subjectId: "", classIds: [] }]);
  };

  const handleRemoveSubject = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (index: number, subjectId: string) => {
    setAssignments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, subjectId } : a)),
    );
  };

  const handleClassChange = (index: number, classIds: string[]) => {
    setAssignments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, classIds } : a)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    acceptMutation.mutate(
      {
        token,
        name,
        password,
        assignments: assignments
          .filter((a) => a.subjectId && a.classIds.length > 0)
          .map((a) => ({ subjectId: a.subjectId, classIds: a.classIds })),
      },
      {
        onSuccess: (data) => {
          setTokens(data.accessToken, data.refreshToken, data.user);
          navigate(getPostAuthPath(data.user));
        },
      },
    );
  };

  if (infoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading invitation...
      </div>
    );
  }

  if (infoError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>{infoError}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Ask your school principal to send a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Join {inviteInfo?.schoolName}</CardTitle>
          <CardDescription>
            You've been invited to join as a teacher. Set your name, password, and
            teaching subjects to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {acceptMutation.isError && (
              <p className="text-sm text-destructive">
                {(acceptMutation.error as Error)?.message}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mr Adeyemi"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Subject Assignments</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSubject}>
                  + Add Subject
                </Button>
              </div>
              {assignments.map((a, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <select
                        value={a.subjectId}
                        onChange={(e) => handleSubjectChange(i, e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        required
                      >
                        <option value="">Select subject</option>
                        {subjectOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <Label className="text-xs text-muted-foreground">Classes</Label>
                      <MultiSelect
                        options={classOptions}
                        selected={a.classIds}
                        onChange={(ids) => handleClassChange(i, ids)}
                        placeholder="Select classes"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSubject(i)}
                      className="mt-5 shrink-0"
                      aria-label="Remove subject"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={acceptMutation.isPending} className="w-full">
              {acceptMutation.isPending ? "Setting up..." : "Accept Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
