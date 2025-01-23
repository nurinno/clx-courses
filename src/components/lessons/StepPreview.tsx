import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { marked } from "marked";
import { StepSuggestion } from "@/types/lesson";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StepPreviewProps {
  steps: StepSuggestion[];
  onAccept: (steps: StepSuggestion[]) => void;
}

export function StepPreview({ steps, onAccept }: StepPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview Generated Steps</h3>
        <Button onClick={() => onAccept(steps)} className="gap-2">
          <Check className="h-4 w-4" />
          Accept Steps
        </Button>
      </div>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">Step {index + 1}: {step.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {step.content}
                </ReactMarkdown>
              </div>
              {step.quiz && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Quiz</h4>
                  <p className="font-medium text-base mb-2">{step.quiz.question}</p>
                  <div className="space-y-1">
                    {step.quiz.options.map((option: string, optIndex: number) => (
                      <div 
                        key={optIndex}
                        className={`p-2 rounded-md border ${
                          option === step.quiz.correctAnswer ? 
                          "bg-green-50 border-green-200" : 
                          "bg-background"
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 