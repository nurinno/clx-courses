import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
}: CoursePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Course Preview</h3>
      </div>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="p-0">
          <CardTitle className="text-base">{courseStructure.title}</CardTitle>
          <CardDescription className="text-sm">{courseStructure.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="space-y-4">
            {courseStructure.modules.map((module: Module, moduleIndex: number) => (
              <div key={moduleIndex} className="space-y-2">
                <h4 className="text-sm font-medium">
                  Module {moduleIndex + 1}: {module.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {module.description}
                </p>
                <ul className="space-y-1 ml-4">
                  {module.lessons.map((lesson: Lesson, lessonIndex: number) => (
                    <li key={lessonIndex} className="text-xs">
                      <span className="font-medium">
                        Lesson {lessonIndex + 1}:
                      </span>{" "}
                      {lesson.title}
                      <p className="text-muted-foreground ml-4 text-xs">
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
    </div>
  );
} 
