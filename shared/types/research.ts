// Type definitions for research-related data structures

export type ModelType = 'combined' | 'compound' | 'llama';

export interface ResearchRequest {
  query: string;
  modelType: ModelType;
}

export interface ResearchResponse {
  queryId: string;
}

export interface ProgressEvent {
  message: string;
  isCompleted: boolean;
  step?: string;
  progress?: number;
}

export interface QuestionsEvent {
  questions: string[];
}

export interface QAEvent {
  question: string;
  answer: string;
}

export interface TitleEvent {
  title: string;
}

export interface OutlineEvent {
  outline: string;
}

export interface ReportSectionEvent {
  section: {
    title: string;
    content: string;
  };
}

export interface ReportEvent {
  report: {
    title: string;
    executiveSummary: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
    conclusion: string;
    references?: string[];
  };
}

export interface ErrorEvent {
  message: string;
}

export interface CompleteEvent {
  message: string;
  reportUrl?: string;
}

export interface ResearchState {
  status: 'idle' | 'loading' | 'researching' | 'completed' | 'error';
  queryId: string | null;
  query: string;
  modelType: ModelType;
  progress: ProgressEvent[];
  currentStep: string;
  progressPercentage: number;
  questions: string[];
  questionAnswers: {
    question: string;
    answer: string;
  }[];
  title: string;
  outline: string;
  report: ReportEvent['report'] | null;
  error: string | null;
}
