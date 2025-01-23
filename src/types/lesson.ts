export interface StepSuggestion {
  title: string;
  content: string;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: string;
  };
} 