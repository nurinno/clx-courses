import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Pencil, Trash2, Check, X, ArrowLeft, Sparkles } from "lucide-react";
import { collection, query, where, onSnapshot, orderBy, addDoc, doc, updateDoc, deleteDoc, writeBatch, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Step, Lesson } from "@/types/course";
import { cn } from "@/lib/utils";
import { QuizEditor } from "@/components/quiz/QuizEditor";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { AIChatOverlay, LessonContext } from "./LessonAIChatOverlay";
import { StepSuggestion } from "@/types/lesson";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { LessonPreview } from "./LessonPreview";

interface SortableStepItemProps {
  step: Step;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (id: string, name: string) => void;
  onDelete: () => void;
}

function SortableStepItem({ step, index, isSelected, onSelect, onEdit, onDelete }: SortableStepItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(step.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedName(step.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = async () => {
    if (editedName.trim() !== step.name) {
      await onEdit(step.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedName(step.name);
    }
  };

  const handleUpdateName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-md border transition-colors mb-2",
        isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-2 inset-y-0 flex items-center cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="pl-8 pr-2 py-4">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                ref={inputRef}
                value={editedName}
                onChange={handleUpdateName}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                onClick={handleInputClick}
                style={{ maxWidth: '200px' }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleSave}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  setIsEditing(false);
                  setEditedName(step.name);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span 
              className="text-sm font-medium cursor-pointer flex-1 py-1 overflow-hidden text-ellipsis whitespace-nowrap"
              onClick={onSelect}
            >
              Step {index + 1}: {step.name}
            </span>
          )}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleStartEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LessonEditor({ lesson }: { lesson: Lesson }) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isAIOverlayOpen, setIsAIOverlayOpen] = useState(false);
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      
      if (!selectedStepId && stepsData.length > 0) {
        setSelectedStepId(stepsData[0].id);
      }
    });

    return () => unsubscribe();
  }, [lesson.id]);

  const handleCreateStep = async () => {
    try {
      const docRef = await addDoc(collection(db, "steps"), {
        lessonId: lesson.id,
        name: "New Step",
        content: "",
        order: steps.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setSelectedStepId(docRef.id);
    } catch (error) {
      console.error("Error creating step:", error);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (window.confirm("Are you sure you want to delete this step?")) {
      try {
        await deleteDoc(doc(db, "steps", stepId));
        if (selectedStepId === stepId) {
          setSelectedStepId(steps.find(s => s.id !== stepId)?.id || null);
        }
      } catch (error) {
        console.error("Error deleting step:", error);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex(step => step.id === active.id);
      const newIndex = steps.findIndex(step => step.id === over.id);
      
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      setSteps(newSteps); // Update local state immediately
      
      // Update order in Firestore
      const batch = writeBatch(db);
      newSteps.forEach((step: Step, index: number) => {
        const stepRef = doc(db, "steps", step.id);
        batch.update(stepRef, { 
          order: index,
          updatedAt: new Date()
        });
      });
      
      try {
        await batch.commit();
      } catch (error) {
        console.error("Error updating step order:", error);
        // Revert local state on error
        setSteps(steps);
      }
    }
  };

  const handleEditStep = async (stepId: string, newName: string) => {
    try {
      await updateDoc(doc(db, "steps", stepId), {
        name: newName,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating step name:", error);
    }
  };

  const handleAcceptAISuggestions = async (suggestions: StepSuggestion[]) => {
    const batch = writeBatch(db);
    
    try {
      // Delete existing steps if any
      const deletePromises = steps.map(step => 
        deleteDoc(doc(db, "steps", step.id))
      );
      await Promise.all(deletePromises);

      // Add new steps
      for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        const docRef = doc(collection(db, "steps"));
        
        batch.set(docRef, {
          lessonId: lesson.id,
          name: suggestion.title,
          content: suggestion.content,
          quiz: suggestion.quiz ? {
            question: suggestion.quiz.question,
            options: suggestion.quiz.options,
            correctAnswer: suggestion.quiz.options[Number(suggestion.quiz.correctOption)] || ""
          } : null,
          order: i,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      await batch.commit();
      setIsAIOverlayOpen(false);
      
      toast({
        title: "Success!",
        description: `Created ${suggestions.length} new steps`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error creating AI-generated steps:", error);
      toast({
        title: "Error",
        description: "Failed to create steps",
        variant: "destructive",
      });
    }
  };

  const fetchLessonContext = async () => {
    try {
      // First get module ID from lesson
      const moduleId = lesson.moduleId;
      if (!moduleId) {
        console.error("Lesson is missing moduleId:", lesson);
        return null;
      }

      // Get module document
      const moduleDoc = await getDoc(doc(db, "modules", moduleId));
      if (!moduleDoc.exists()) {
        console.error("Module not found:", moduleId);
        return null;
      }
      const moduleData = moduleDoc.data();
      const courseId = moduleData.courseId;
      
      // Validate course ID
      if (!courseId) {
        console.error("Module is missing courseId:", moduleId);
        return null;
      }

      // Get course document
      const courseDoc = await getDoc(doc(db, "courses", courseId));
      if (!courseDoc.exists()) {
        console.error("Course not found:", courseId);
        return null;
      }
      const courseData = courseDoc.data();

      // Get other lessons in module
      const lessonsQuery = query(
        collection(db, "lessons"),
        where("moduleId", "==", moduleId),
        orderBy("order")
      );
      const lessonsSnapshot = await getDocs(lessonsQuery);
      
      return {
        courseId: courseId,
        lessonId: lesson.id,
        courseName: courseData.title || "Unnamed Course",
        courseDescription: courseData.description || "",
        moduleInfo: {
          name: moduleData.title || "Unnamed Module",
          description: moduleData.description || ""
        },
        otherLessons: lessonsSnapshot.docs
          .filter(d => d.id !== lesson.id) // Exclude current lesson
          .map(d => ({
            name: d.data().title,
            description: d.data().description || ""
          })),
        currentLesson: {
          name: lesson.title,
          description: lesson.description || ""
        }
      };
    } catch (error) {
      console.error("Error fetching lesson context:", error);
      return null;
    }
  };

  const handleOpenAIOverlay = async () => {
    const context = await fetchLessonContext();
    if (context) {
      setLessonContext(context);
      setIsAIOverlayOpen(true);
    }
  };

  const selectedStep = steps.find(s => s.id === selectedStepId);

  return (
    <div className="relative w-full h-full">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Edit Lesson Content: {lesson.title}</h1>
              <p className="text-sm text-muted-foreground">Add and manage steps and quizzes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
            >
              Preview Lesson
            </Button>
            <Button
              variant="default"
              onClick={handleOpenAIOverlay}
              className="bg-black hover:bg-black/90 text-white gap-1"
            >
              <Sparkles className="h-4 w-4" />
              AI Assist
            </Button>
          </div>
        </div>

        <div className="flex gap-6 p-6 flex-1 min-h-0">
          {/* Steps Panel */}
          <div className="w-72 shrink-0 border rounded-lg bg-card">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Steps</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateStep}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={steps.map(step => step.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {steps.map((step, index) => (
                    <SortableStepItem
                      key={step.id}
                      step={step}
                      index={index}
                      isSelected={selectedStepId === step.id}
                      onSelect={() => setSelectedStepId(step.id)}
                      onEdit={handleEditStep}
                      onDelete={() => handleDeleteStep(step.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Editor Section */}
          <div className="flex-1 min-w-0 border rounded-lg bg-card">
            {selectedStep ? (
              <div className="h-full flex flex-col border rounded-lg overflow-hidden">
                <RichTextEditor
                  key={selectedStep.id}
                  content={selectedStep.content}
                  onChange={async (content) => {
                    await updateDoc(doc(db, "steps", selectedStep.id), {
                      content: content,
                      updatedAt: new Date()
                    });
                  }}
                  className="h-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a step to start editing
              </div>
            )}
          </div>

          {/* Quiz Section */}
          <div className="w-80 shrink-0 border rounded-lg bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Quiz for {selectedStep?.name}</h3>
            </div>
            <div className="p-4">
              {selectedStep ? (
                <QuizEditor
                  key={selectedStep.id}
                  quiz={selectedStep.quiz || null}
                  onChange={async (quiz) => {
                    if (!selectedStep) return;
                    await updateDoc(doc(db, "steps", selectedStep.id), {
                      quiz,
                      updatedAt: new Date()
                    });
                  }}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Select a step to configure its quiz
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAIOverlayOpen && lessonContext && (
        <AIChatOverlay
          isOpen={isAIOverlayOpen}
          onClose={() => setIsAIOverlayOpen(false)}
          onAcceptSuggestions={handleAcceptAISuggestions}
          lessonContext={lessonContext}
          width="1300px"
          height="700px"
        />
      )}

      {showPreview && (
        <LessonPreview
          lesson={lesson}
          steps={steps}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

export default function MarkdownEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [editMode, setEditMode] = useState<"edit" | "preview">("edit");

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex gap-2 mb-2">
        <Button
          variant={editMode === "edit" ? "default" : "ghost"}
          onClick={() => setEditMode("edit")}
          size="sm"
        >
          Edit
        </Button>
        <Button
          variant={editMode === "preview" ? "default" : "ghost"}
          onClick={() => setEditMode("preview")}
          size="sm"
        >
          Preview
        </Button>
      </div>
      
      {editMode === "edit" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-4 font-mono text-sm bg-background rounded-lg border"
        />
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none flex-1 overflow-auto">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}