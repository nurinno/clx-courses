import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CourseStructure {
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
}

interface CoursePreviewProps {
  courseStructure: CourseStructure;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isCreating: boolean;
}

interface Module {
  title: string;
  description: string;
  lessons: {
    title: string;
    description: string;
  }[];
}

interface Lesson {
  title: string;
  description: string;
}

export function CoursePreview({
  courseStructure,
  onConfirm,
  onCancel,
  isCreating,
}: CoursePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Course Preview</h3>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isCreating}>
            Create Course
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[60vh]">
        <Card>
          <CardHeader>
            <CardTitle>{courseStructure.title}</CardTitle>
            <CardDescription>{courseStructure.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {courseStructure.modules.map((module: Module, moduleIndex: number) => (
                <div key={moduleIndex} className="space-y-2">
                  <h4 className="font-medium">
                    Module {moduleIndex + 1}: {module.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {module.description}
                  </p>
                  <ul className="space-y-1 ml-4">
                    {module.lessons.map((lesson: Lesson, lessonIndex: number) => (
                      <li key={lessonIndex} className="text-sm">
                        <span className="font-medium">
                          Lesson {lessonIndex + 1}:
                        </span>{" "}
                        {lesson.title}
                        <p className="text-muted-foreground ml-4">
                          {lesson.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
} 
