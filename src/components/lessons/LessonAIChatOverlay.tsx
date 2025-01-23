import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";
import { streamWithClaude } from "@/lib/claude";
import { useToast } from "@/hooks/use-toast";
import { LESSON_STEPS_PROMPT } from '@/lib/ai-agents/prompts';
import { marked } from 'marked';
import { StepPreview } from "./StepPreview";
import { StepSuggestion } from "@/types/lesson";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export interface LessonContext {
  courseId: string;
  lessonId: string;
  courseName: string;
  courseDescription: string;
  moduleInfo: {
    name: string;
    description: string;
  };
  otherLessons: {
    name: string;
    description: string;
  }[];
  currentLesson: {
    name: string;
    description: string;
  };
}

interface StepPreview {
  suggestions: StepSuggestion[];
}

interface AIChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptSuggestions: (suggestions: StepSuggestion[]) => void;
  lessonContext: LessonContext;
  width?: string;
  height?: string;
}

export function AIChatOverlay({ 
  isOpen, 
  onClose, 
  onAcceptSuggestions, 
  lessonContext,
  width = "900px",
  height = "700px"
}: AIChatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: `I'll help you create steps for "${lessonContext.currentLesson.name}".

Here's what I know about the context:

**Course**: ${lessonContext.courseName}
${lessonContext.courseDescription}

**Module**: ${lessonContext.moduleInfo.name}
${lessonContext.moduleInfo.description}

**Current Lesson**: ${lessonContext.currentLesson.name}
${lessonContext.currentLesson.description}

How would you like to structure the steps for this lesson? I can:
1. Generate a complete set of steps
2. Focus on specific aspects or topics
3. Create steps with particular learning objectives

What would you like me to do?`
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [stepPreview, setStepPreview] = useState<StepSuggestion[] | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const contextEnrichedPrompt = `${LESSON_STEPS_PROMPT}\n\nContext:\nCourse: ${lessonContext.courseName}\nLesson: ${lessonContext.currentLesson.name}\n\nPlease keep this context in mind when generating steps.`;

      const response = await streamWithClaude({
        messages: [...messages, userMessage],
        system: contextEnrichedPrompt,
      });

      let fullResponse = '';
      for await (const chunk of response) {
        fullResponse += chunk;
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "assistant", content: fullResponse }
        ]);
      }

      if (fullResponse.includes('"suggestions"')) {
        try {
          const parsedResponse = JSON.parse(
            fullResponse
              .replace(/```json/g, '')
              .replace(/```/g, '')
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
              .trim()
          );
          
          if (parsedResponse.suggestions?.length) {
            const formattedSuggestions = parsedResponse.suggestions.map((suggestion: any) => ({
              ...suggestion,
              content: suggestion.content
                .replace(/\\n/g, '\n')  // Handle escaped newlines
                .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
            }));
            
            setStepPreview(formattedSuggestions);
          }
        } catch (parseError) {
          console.error("Failed to parse Claude response:", parseError);
          toast({
            title: "Error",
            description: "Failed to parse AI response. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error("Error with Claude:", err);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}

      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-background rounded-lg border shadow-lg flex flex-col"
        style={{
          width,
          height,
          maxHeight: '95vh',
          maxWidth: '95vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b bg-background flex items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Generate Steps with AI</h1>
            <p className="text-sm text-muted-foreground">Chat with AI to automatically generate lesson steps.</p>
          </div>
        </header>

        <div 
          className="flex-1 overflow-y-auto p-6 min-h-0"
          style={{ paddingBottom: stepPreview ? '400px' : '0' }}
        >
          <div className="flex flex-col gap-4 w-full">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } w-full`}
              >
                {message.content.includes('"suggestions"') ? (
                  <div className="w-full max-w-[800px] mr-auto">
                    <div className="bg-background border rounded-lg p-4 space-y-4">
                      <h3 className="font-semibold text-lg">Generated Steps Preview</h3>
                      <StepPreview 
                        steps={stepPreview || []} 
                        onAccept={onAcceptSuggestions}
                      />
                    </div>
                  </div>
                ) : (
                  message.content === "" && loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating steps...
                    </div>
                  ) : (
                    <div
                      className={`rounded-lg px-4 py-3 p-2 prose prose-sm dark:prose-invert ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted mr-auto"
                      }`}
                      style={{
                        maxWidth: '500px',
                        overflowWrap: 'break-word',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: marked(message.content)
                      }}
                    />
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t px-6 py-4 bg-background shrink-0">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 min-h-[40px]"
              />
              <Button 
                type="submit" 
                disabled={loading}
                className="h-10 shrink-0 flex items-center justify-center"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
} 