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
  deadline: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
} 