import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { CreateCourseDialog } from "@/components/courses/CreateCourseDialog";
import type { Course } from "@/types/course";
import { collection, onSnapshot, query, Timestamp, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarIcon, Users, Trash2, MoreVertical, BookOpen } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { EditCourseDialog } from "@/components/courses/EditCourseDialog";
import { formatDate } from "@/lib/utils";

const ManageCourses = () => {
  useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "courses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : null,
          deadline: data.deadline instanceof Timestamp ? data.deadline.toDate() : null,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
        };
      }) as Course[];
      setCourses(coursesData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!courses.length) return;

    const courseIds = courses.map(c => c.id);
    const moduleQuery = query(
      collection(db, "modules"),
      where("courseId", "in", courseIds)
    );

    const unsubscribe = onSnapshot(moduleQuery, async (moduleSnapshot) => {
      const moduleIds = moduleSnapshot.docs.map(doc => doc.id);
      
      if (!moduleIds.length) {
        setLessonCounts({});
        return;
      }

      const lessonQuery = query(
        collection(db, "lessons"),
        where("moduleId", "in", moduleIds)
      );

      const lessonSnapshot = await getDocs(lessonQuery);
      const lessonsByCourse = lessonSnapshot.docs.reduce((acc, doc) => {
        const lesson = doc.data();
        const module = moduleSnapshot.docs.find(m => m.id === lesson.moduleId);
        if (module) {
          const courseId = module.data().courseId;
          acc[courseId] = (acc[courseId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      setLessonCounts(lessonsByCourse);
    });

    return () => unsubscribe();
  }, [courses]);

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await deleteDoc(doc(db, "courses", courseId));
        setCourses((prevCourses) => prevCourses.filter(course => course.id !== courseId));
        
        navigate("/manage-courses");
      } catch (error) {
        console.error("Error deleting course:", error);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <nav className="flex items-center text-lg">
          <span className="font-semibold">Manage Courses</span>
        </nav>
        <div className="flex gap-4">
          <CreateCourseDialog />
          <Button onClick={() => navigate("/create-course-ai")}>
            Create Course with AI
          </Button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold">No courses available</p>
            <p className="text-muted-foreground">
              Get started by creating your first course.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={(e) => {
                if (!e.defaultPrevented) {
                  navigate(`/manage-courses/${course.id}`);
                }
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {course.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem asChild>
                        <EditCourseDialog 
                          course={course} 
                          onOpenChange={(open) => {
                            if (!open) {
                              const dropdownTrigger = document.querySelector('[data-state="open"]');
                              if (dropdownTrigger instanceof HTMLElement) {
                                dropdownTrigger.click();
                              }
                            }
                          }} 
                        />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {course.startDate 
                        ? `Starts ${formatDate(course.startDate)}`
                        : "No start date set"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {course.deadline 
                        ? `Ends ${formatDate(course.deadline)}`
                        : "No end date set"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {course.assignedUsers?.length 
                        ? `${course.assignedUsers.length} users`
                        : "No users assigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {lessonCounts[course.id] 
                        ? `${lessonCounts[course.id]} lessons`
                        : "No lessons yet"}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(ManageCourses);