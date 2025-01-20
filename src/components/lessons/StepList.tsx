import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { Step } from "@/types/course";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StepListProps {
  steps: Step[];
  onEdit: (stepId: string) => void;
  currentEditingId: string | null;
}

export function StepList({ steps, onEdit, currentEditingId }: StepListProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const handleDeleteStep = async (stepId: string) => {
    if (window.confirm("Are you sure you want to delete this step?")) {
      try {
        await deleteDoc(doc(db, "steps", stepId));
      } catch (error) {
        console.error("Error deleting step:", error);
      }
    }
  };

  const toggleExpand = (stepId: string) => {
    setExpandedStepId(expandedStepId === stepId ? null : stepId);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Steps</div>
      <div className="space-y-2">
        {steps.map((step) => (
          <Card key={step.id} className="hover:shadow-sm transition-shadow">
            <CardHeader 
              className={cn(
                "cursor-pointer group",
                !expandedStepId && "pb-4"
              )}
              onClick={() => toggleExpand(step.id)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {step.name}
                    </CardTitle>
                    {expandedStepId === step.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {step.quiz && (
                    <CardDescription className="flex items-center gap-2">
                      <span>Quiz: {step.quiz.question}</span>
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(step.id);
                    }}
                    disabled={currentEditingId === step.id}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStep(step.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {expandedStepId === step.id && (
              <CardContent className="pt-0">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: step.content }}
                />
                {step.quiz && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Quiz</h4>
                    <p>{step.quiz.question}</p>
                    <div className="space-y-1">
                      {step.quiz.options.map((option, index) => (
                        <div 
                          key={index}
                          className={cn(
                            "p-2 rounded-md border",
                            option === step.quiz?.correctAnswer && "bg-green-50 border-green-200"
                          )}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
} 