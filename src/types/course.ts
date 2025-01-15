export interface Course {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  deadline?: Date;
  assignedUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  deadline: Date | { seconds: number; nanoseconds: number } | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  deadline: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseStructure {
  type: "course_structure";
  data: {
    title: string;
    description: string;
    modules: {
      title: string;
      description: string;
      lessons: {
        title: string;
        description: string;
      }[];
    }[];
  };
} 

