import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, ArrowLeft } from "lucide-react";
import { streamWithClaude } from "@/lib/claude";
import { useToast } from "@/hooks/use-toast";
import { CoursePreview } from "./CoursePreview";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface CourseStructure {
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

export function CreateCourseAIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm here to help you create a course. What topic would you like to teach?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [courseStructure, setCourseStructure] = useState<CourseStructure | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm here to help you create a course. What topic would you like to teach?",
      },
    ]);
    setInput("");
    setLoading(false);
    setCourseStructure(null);
    setIsCreating(false);
  }, []);

  const createCourse = async () => {
    if (!courseStructure) return;

    setIsCreating(true);
    try {
      const courseRef = await addDoc(collection(db, "courses"), {
        title: courseStructure.data.title,
        description: courseStructure.data.description,
        createdAt: Timestamp.now(),
        startDate: Timestamp.now(),
      });

      for (const [moduleIndex, module] of courseStructure.data.modules.entries()) {
        const moduleRef = await addDoc(collection(db, "modules"), {
          courseId: courseRef.id,
          title: module.title,
          description: module.description,
          order: moduleIndex,
          createdAt: Timestamp.now(),
        });

        for (const [lessonIndex, lesson] of module.lessons.entries()) {
          await addDoc(collection(db, "lessons"), {
            moduleId: moduleRef.id,
            title: lesson.title,
            description: lesson.description,
            order: lessonIndex,
            createdAt: Timestamp.now(),
          });
        }
      }

      toast({
        title: "Success",
        description: "Course created successfully!",
      });

      navigate(`/manage-courses/${courseRef.id}`);
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let aiResponse = '';
      const stream = streamWithClaude(messages.concat(userMessage));
      
      // Create a temporary message for streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      
      for await (const chunk of stream) {
        aiResponse += chunk;
        // Update the last message with the accumulated response
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: aiResponse }
        ]);
      }

      if (aiResponse.includes('"type": "course_structure"')) {
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const structure: CourseStructure = JSON.parse(jsonMatch[0]);
            if (structure.type === "course_structure") {
              setCourseStructure(structure);
            }
          }
        } catch (error) {
          console.error("Error parsing course structure:", error);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <header className="px-6 py-4 border-b bg-background flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/manage-courses")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Create Course with AI</h1>
          <p>Chat with AI to automatically generate a structured course outline.</p>
        </div>
      </header>
      {courseStructure ? (
        <div className="flex-1 overflow-y-auto px-6">
          <CoursePreview
            courseStructure={courseStructure.data}
            onConfirm={createCourse}
            onCancel={() => setCourseStructure(null)}
            isCreating={isCreating}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted mr-auto"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <footer className="border-t p-6 bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </Button>
        </form>
      </footer>
    </div>
  );
} 