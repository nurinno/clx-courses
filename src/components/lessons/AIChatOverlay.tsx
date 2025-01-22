import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";
import { streamWithClaude } from "@/lib/claude";
import { useToast } from "@/hooks/use-toast";
import { LESSON_STEPS_PROMPT } from '@/lib/ai-agents/prompts';
import { marked } from 'marked';

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface AIChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptSuggestions: (suggestions: any[]) => void;
  lessonContext: {
    courseId: string;
    lessonId: string;
    courseName: string;
    lessonName: string;
  };
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
    content: `Hi! I'm here to help you create lesson steps for "${lessonContext.lessonName}" in the course "${lessonContext.courseName}". What kind of steps would you like to generate?`
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

      const contextEnrichedPrompt = `${LESSON_STEPS_PROMPT}\n\nContext:\nCourse: ${lessonContext.courseName}\nLesson: ${lessonContext.lessonName}\n\nPlease keep this context in mind when generating steps.`;

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
          const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0]);
            onAcceptSuggestions(parsedResponse.suggestions);
          }
        } catch (parseError) {
          console.error("Failed to parse Claude response:", parseError);
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

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="flex flex-col gap-4 w-full">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } w-full`}
              >
                <div
                  className={`rounded-lg px-4 py-3 p-2 prose prose-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto prose-invert"
                      : "bg-muted mr-auto"
                  }`}
                  style={{
                    maxWidth: '500px',
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: marked(message.content)
                  }}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="border-t px-6 py-4 bg-background shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 min-h-[40px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button 
              type="submit" 
              disabled={loading}
              className="h-10 flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </form>
        </footer>
      </div>
    </div>
  );
} 