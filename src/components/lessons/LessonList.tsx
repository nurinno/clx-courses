import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Lesson } from "@/types/course";

interface LessonListProps {
  moduleId: string;
  lessons: Lesson[];
}

export function LessonList({ moduleId, lessons }: LessonListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");

  // Sort lessons by order
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    try {
      await addDoc(collection(db, "lessons"), {
        moduleId,
        title: newLessonTitle,
        description: "",
        order: lessons.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setNewLessonTitle("");
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding lesson:", error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      try {
        await deleteDoc(doc(db, "lessons", lessonId));
      } catch (error) {
        console.error("Error deleting lesson:", error);
      }
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="text-sm font-medium">Lessons</div>
      <div className="space-y-2">
        {sortedLessons.map((lesson) => (
          <div
            key={lesson.id}
            className="flex items-center justify-between py-2 px-3 bg-muted rounded-md"
          >
            <span>{lesson.title}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteLesson(lesson.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {isAdding ? (
          <form onSubmit={handleAddLesson} className="flex gap-2">
            <Input
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              placeholder="Lesson title"
              autoFocus
            />
            <Button type="submit" size="sm">Add</Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        )}
      </div>
    </div>
  );
}