import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Lesson } from "@/types/course";
import { LessonEditor } from "@/components/lessons/LessonEditor";

export default function LessonDetailsPage() {
  const { lessonId } = useParams();
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
    <div className="w-full h-full">
      <LessonEditor lesson={lesson} />
    </div>
  );
} 