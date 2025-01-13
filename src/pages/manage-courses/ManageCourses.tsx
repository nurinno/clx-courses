import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const ManageCourses = () => {
  const { user } = useAuth();
  const courses = [];

  console.log('ManageCourses render - User:', user?.email);

  React.useLayoutEffect(() => {
    document.title = "Manage Courses";
  }, []);

  React.useEffect(() => {
    console.log('ManageCourses mounted');
    return () => {
      console.log('ManageCourses unmounted');
    };
  }, []);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Courses</h1>
        <div className="flex gap-4">
          <Button>Create Course</Button>
          <Button>Create Course with AI</Button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100%-theme(spacing.24))]">
          <p className="text-gray-500 text-lg">No courses available.</p>
        </div>
      ) : (
        <div>{/* Course list */}</div>
      )}
    </div>
  );
};

export default React.memo(ManageCourses);