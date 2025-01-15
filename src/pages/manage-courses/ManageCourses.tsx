import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { CreateCourseDialog } from "@/components/courses/CreateCourseDialog";
import type { Course } from "@/types/course";
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarIcon, Users, Trash2, MoreVertical } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { EditCourseDialog } from "@/components/courses/EditCourseDialog";

const formatDate = (date: Date | null | undefined) => {
  if (!date) return "Not set";
  try {
    return format(date, 'PP');
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

const ManageCourses = () => {
  useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Setting up courses listener");
    const q = query(collection(db, "courses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Received courses update:", snapshot.docs.length, "courses");
      const coursesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Processing course:", doc.id, data);
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : null,
          deadline: data.deadline instanceof Timestamp ? data.deadline.toDate() : null,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
        };
      }) as Course[];
      console.log("Setting courses:", coursesData);
      setCourses(coursesData);
    });

    return () => {
      console.log("Cleaning up courses listener");
      unsubscribe();
    };
  }, []);

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await deleteDoc(doc(db, "courses", courseId));
      } catch (error) {
        console.error("Error deleting course:", error);
      }
    }
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-8">
        <nav className="flex items-center text-lg">
          <span className="font-semibold">Manage Courses</span>
        </nav>
        <div className="flex gap-4">
          <CreateCourseDialog />
          <Button>Create Course with AI</Button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100%-theme(spacing.24))]">
          <p className="text-gray-500 text-lg">No courses available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <CardTitle>{course.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
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
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteCourse(course.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="mt-2">{course.description}</CardDescription>
                <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Starts {formatDate(course.startDate)}</span>
                  </div>
                  {course.deadline && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Ends {formatDate(course.deadline)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.assignedUsers.length} users</span>
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