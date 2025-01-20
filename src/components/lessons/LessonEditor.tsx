import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Step, Lesson } from "@/types/course";
import { StepEditor } from "@/components/lessons/StepEditor";
import { StepList } from "@/components/lessons/StepList";

interface LessonEditorProps {
  lesson: Lesson;
  onClose: () => void;
}

export function LessonEditor({ lesson, onClose }: LessonEditorProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "steps"),
      where("lessonId", "==", lesson.id),
      orderBy("order")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stepsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Step[];
      setSteps(stepsData);
    });

    return () => unsubscribe();
  }, [lesson.id]);

  return (
    <div className="space-y-4">
      {steps.length === 0 && !isAddingStep ? (
        <Card className="border-dashed">
          <CardHeader className="space-y-4 items-center text-center">
            <div className="p-4 bg-muted rounded-full">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>No steps yet</CardTitle>
              <p className="text-muted-foreground">
                Get started by adding your first step to this lesson.
              </p>
            </div>
            <Button onClick={() => setIsAddingStep(true)}>
              Add First Step
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          <StepList
            steps={steps}
            onEdit={setEditingStepId}
            currentEditingId={editingStepId}
          />
          {!editingStepId && !isAddingStep && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsAddingStep(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          )}
        </div>
      )}

      {(isAddingStep || editingStepId) && (
        <StepEditor
          lessonId={lesson.id}
          step={editingStepId ? steps.find(s => s.id === editingStepId) : undefined}
          stepsCount={steps.length}
          onClose={() => {
            setEditingStepId(null);
            setIsAddingStep(false);
          }}
        />
      )}
    </div>
  );
}