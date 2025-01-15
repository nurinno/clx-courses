import { useState } from "react";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { addDoc, collection, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Lesson } from "@/types/course";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LessonListProps {
  moduleId: string;
  lessons: Lesson[];
}

export function LessonList({ moduleId, lessons }: LessonListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDescription, setNewLessonDescription] = useState("");
  const [newLessonDeadline, setNewLessonDeadline] = useState<Date | undefined>();
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingDeadline, setEditingDeadline] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    try {
      await addDoc(collection(db, "lessons"), {
        moduleId,
        title: newLessonTitle,
        description: newLessonDescription || "",
        deadline: newLessonDeadline ? Timestamp.fromDate(newLessonDeadline) : null,
        order: lessons.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setNewLessonTitle("");
      setNewLessonDescription("");
      setNewLessonDeadline(undefined);
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding lesson:", error);
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent, lessonId: string) => {
    e.preventDefault();
    if (!editingTitle.trim()) return;

    try {
      await updateDoc(doc(db, "lessons", lessonId), {
        title: editingTitle,
        description: editingDescription || "",
        deadline: editingDeadline ? Timestamp.fromDate(editingDeadline) : null,
        updatedAt: new Date(),
      });
      setEditingId(null);
      setEditingTitle("");
      setEditingDescription("");
      setEditingDeadline(undefined);
    } catch (error) {
      console.error("Error updating lesson:", error);
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

  const startEditing = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setEditingTitle(lesson.title);
    setEditingDescription(lesson.description || "");
    setEditingDeadline(lesson.deadline || undefined);
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="text-sm font-medium">Lessons</div>
      <div className="space-y-2">
        {sortedLessons.map((lesson) => (
          <Card key={lesson.id} className="hover:shadow-sm transition-shadow">
            {editingId === lesson.id ? (
              <CardContent className="p-4">
                <form onSubmit={(e) => handleUpdateLesson(e, lesson.id)} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Lesson title"
                      autoFocus
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      placeholder="Lesson description"
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Deadline (Optional)</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editingDeadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editingDeadline ? format(editingDeadline, "PPP") : "Set deadline"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editingDeadline}
                          onSelect={(date) => {
                            setEditingDeadline(date);
                            setCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Save</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingId(null);
                        setEditingTitle("");
                        setEditingDescription("");
                        setEditingDeadline(undefined);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            ) : (
              <CardHeader className="cursor-pointer group" onClick={() => startEditing(lesson)}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {lesson.title}
                    </CardTitle>
                    {lesson.description && (
                      <CardDescription>{lesson.description}</CardDescription>
                    )}
                    {lesson.deadline && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>Due {formatDate(lesson.deadline)}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLesson(lesson.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            )}
          </Card>
        ))}
        {isAdding ? (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleAddLesson} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-title">Title</Label>
                  <Input
                    id="new-title"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="Lesson title"
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-description">Description (Optional)</Label>
                  <Textarea
                    id="new-description"
                    value={newLessonDescription}
                    onChange={(e) => setNewLessonDescription(e.target.value)}
                    placeholder="Lesson description"
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Deadline (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newLessonDeadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newLessonDeadline ? format(newLessonDeadline, "PPP") : "Set deadline"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newLessonDeadline}
                        onSelect={setNewLessonDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Add Lesson</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsAdding(false);
                      setNewLessonTitle("");
                      setNewLessonDescription("");
                      setNewLessonDeadline(undefined);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
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