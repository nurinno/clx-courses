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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Courses</h1>
      {courses.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-500 mb-4">No courses available.</p>
          <div className="flex justify-center gap-4">
            <Button>Create Course</Button>
            <Button>Create Course with AI</Button>
          </div>
        </div>
      ) : (
        <div>{/* Course list */}</div>
      )}
    </div>
  );
};

export default React.memo(ManageCourses);