export interface SubjectAssignment {
  id: string;
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  classes: Array<{
    id: string;
    name: string;
    level: string;
    arm?: string;
  }>;
}
