import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Lesson } from "@/types/course";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LessonEditor } from "@/components/lessons/LessonEditor";

export default function LessonDetailsPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!lessonId) return;

    const unsubscribe = onSnapshot(doc(db, "lessons", lessonId), (doc) => {
      if (doc.exists()) {
        setLesson({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          deadline: doc.data().deadline?.toDate(),
        } as Lesson);
      }
    });

    return () => unsubscribe();
  }, [lessonId]);

  if (!lesson) return null;

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-full max-w-4xl flex flex-col h-full">
        <header className="px-6 py-4 border-b bg-background flex items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Edit Lesson Content: {lesson.title}</h1>
            <p className="text-sm text-muted-foreground">
              Add and manage steps and quizzes
            </p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <LessonEditor 
            lesson={lesson} 
            onClose={() => navigate(-1)} 
          />
        </main>
      </div>
    </div>
  );
} 