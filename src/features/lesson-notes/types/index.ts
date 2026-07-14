export interface PresentationStep {
  step: number;
  time: string;
  teacherActivity: string;
  studentActivity: string;
}

export interface GenerateResponse {
  subject: string;
  className: string;
  term: string;
  week: number;
  topic: string;
  duration: string;
  topicSummary: string;
  backgroundInfo: string;
  behaviouralObjectives: string[];
  instructionalMaterials: string[];
  previousKnowledge: string;
  introduction: string;
  presentationSteps: PresentationStep[];
  evaluation: string;
  conclusion: string;
  assignment: string;
  remarks: string;
}

export interface LessonNote {
  id: string;
  userId: string;
  subjectName: string;
  className: string;
  term: number;
  week: number;
  topic: string;
  date: string;
  content: GenerateResponse;
  createdAt: number;
  updatedAt: number;
}

export interface CurriculumTopic {
  term: number;
  week: number;
  topic: string;
}

export interface CurriculumResponse {
  className: string;
  subjects: string[];
  subjectName?: string;
  topics?: CurriculumTopic[];
}

export interface GenerateRequest {
  subjectName: string;
  className: string;
  week: number;
  term: number;
}
