import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Course, Module } from "@/types/course";
import { CreateModuleDialog } from "@/components/modules/CreateModuleDialog";
import { Layers as LayersIcon, ChevronRight, MoreVertical, Trash2 } from "lucide-react";
import { EditModuleDialog } from "@/components/modules/EditModuleDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    if (!courseId) return;

    const unsubscribe = onSnapshot(doc(db, "courses", courseId), (doc) => {
      if (doc.exists()) {
        setCourse({
          id: doc.id,
          ...doc.data(),
        } as Course);
      }
    });

    return () => unsubscribe();
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;

    const q = query(
      collection(db, "modules"),
      where("courseId", "==", courseId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const modulesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Module[];
      setModules(modulesData);
    });

    return () => unsubscribe();
  }, [courseId]);

  const handleDeleteModule = async (moduleId: string) => {
    if (window.confirm("Are you sure you want to delete this module?")) {
      try {
        await deleteDoc(doc(db, "modules", moduleId));
      } catch (error) {
        console.error("Error deleting module:", error);
      }
    }
  };

  if (!course) return null;

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-8">
        <nav className="flex items-center text-lg">
          <Link 
            to="/manage-courses" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Manage Courses
          </Link>
          <ChevronRight className="h-5 w-5 mx-3" />
          <span className="font-semibold">{course.title}</span>
        </nav>
        {modules.length > 0 && <CreateModuleDialog courseId={courseId!} />}
      </div>

      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100%-theme(spacing.24))] gap-4">
          <div className="p-4 bg-muted rounded-full">
            <LayersIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold">No modules yet</p>
            <p className="text-muted-foreground">
              Get started by creating your first module for this course.
            </p>
          </div>
          <CreateModuleDialog courseId={courseId!} />
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{module.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <EditModuleDialog module={module} />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteModule(module.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="mt-2">{module.description}</CardDescription>
                <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
                  {module.deadline && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Due {formatDate(module.deadline)}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 