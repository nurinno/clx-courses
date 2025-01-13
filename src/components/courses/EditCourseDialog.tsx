import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Course } from "@/types/course";

interface EditCourseDialogProps {
  course: Course;
}

export function EditCourseDialog({ course }: EditCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [startDate, setStartDate] = useState<Date>(course.startDate || new Date());
  const [deadline, setDeadline] = useState<Date | undefined>(course.deadline);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(course.title);
      setDescription(course.description || "");
      setStartDate(course.startDate || new Date());
      setDeadline(course.deadline);
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      const courseRef = doc(db, "courses", course.id);
      await updateDoc(courseRef, {
        title,
        description: description || "",
        startDate: Timestamp.fromDate(startDate),
        deadline: deadline ? Timestamp.fromDate(deadline) : null,
        updatedAt: Timestamp.fromDate(new Date()),
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating course:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (calendarOpen || endCalendarOpen) return;
      setOpen(value);
    }}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 w-full">
          <Pencil className="h-4 w-4" />
          <span>Edit</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Make changes to the course details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Basics of Sales"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Course description..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" onInteractOutside={(e) => {
                  e.preventDefault();
                }}>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Course End Date (Optional)</Label>
              <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" onInteractOutside={(e) => {
                  e.preventDefault();
                }}>
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(date) => {
                      setDeadline(date);
                      setEndCalendarOpen(false);
                    }}
                    initialFocus
                    fromDate={startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !title}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 