import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { streamWithClaude } from "@/lib/claude";
import { Lesson, Step } from "@/types/lesson";
import { marked } from 'marked';
import { LESSON_CHAT_PROMPT } from '@/lib/ai-agents/prompts';

interface LessonPreviewProps {
  lesson: Lesson;
  steps: Step[];
  onClose: () => void;
}

interface Quiz {
  question: string;
  options: string[];
  correctAnswer: string;
}

export function LessonPreview({ lesson, steps, onClose }: LessonPreviewProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([{
    role: "assistant",
    content: `👋 Welcome to **${lesson.title}**! I'll be your AI tutor for this lesson.\n\nLet's start with the first step. Take a moment to read through the content on the left, and feel free to ask me any questions about it. When you're ready to proceed, let me know and I'll check your understanding with a quick quiz.`
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStep = steps[currentStepIndex];
  const quiz = currentStep?.quiz;
  const isQuizCorrect = quiz?.options[selectedAnswer || 0] === quiz?.correctAnswer;

  const handleQuizAnswer = (index: number) => {
    setSelectedAnswer(index);
    if(quiz && quiz.options[index] === quiz.correctAnswer) {
      setTimeout(() => {
        setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
        setSelectedAnswer(null);
        setShowQuiz(false);
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Great job! Let's move on to the next step." 
        }]);
      }, 1500);
    } else {
      setTimeout(() => {
        setSelectedAnswer(null);
      }, 1500);
    }
  };


  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await streamWithClaude({
        messages: [...messages, userMessage],
        system: `${LESSON_CHAT_PROMPT}\n\nCurrent Step Content:\n${currentStep.content}\n\nWhen the student is ready for the quiz, respond with exactly: !show-quiz!`
      });

      // Add a temporary message for streaming
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let fullResponse = '';
      let shouldShowQuiz = false;

      for await (const chunk of response) {
        fullResponse += chunk;
        if (fullResponse.includes('!show-quiz!')) {
          shouldShowQuiz = true;
          break;
        }
        // Update only the last message (assistant's response)
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "assistant", content: fullResponse }
        ]);
      }

      if (shouldShowQuiz) {
        setMessages(prev => [
          ...prev.slice(0, -1), // Remove the streaming message
          { role: "assistant", content: "Let's check your understanding with a quick quiz!" }
        ]);
        setShowQuiz(true);
      }
    } catch (err) {
      console.error("Chat error:", err);
      // Remove the temporary message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full flex">
        {/* Left: Step Content */}
        <div className="w-1/2 h-full flex flex-col border-r">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold">Step {currentStepIndex + 1} of {steps.length}</h2>
            </div>
            <div className="text-sm text-muted-foreground">
              {lesson.title}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: marked(currentStep?.content || '') }} />
            </div>
          </div>
        </div>

        {/* Right: AI Tutor */}
        <div className="w-1/2 h-full flex flex-col bg-background border-l">
          <div className="p-4 border-b">
            <h2 className="font-semibold">AI Tutor</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div
                  className={`rounded-lg px-4 py-3 max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                  dangerouslySetInnerHTML={{ __html: marked(msg.content) }}
                />
              </div>
            ))}
          </div>

          {!showQuiz ? (
            <form onSubmit={handleChatSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this step..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-4 border-t">
              <h3 className="font-semibold mb-4">Quiz Time!</h3>
              <div className="prose dark:prose-invert mb-4">
                <p>{quiz?.question}</p>
              </div>
              <div className="space-y-2">
                {quiz?.options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant={selectedAnswer === index ? 'secondary' : 'outline'}
                    className="w-full text-left justify-start"
                    onClick={() => handleQuizAnswer(index)}
                    disabled={selectedAnswer !== null && selectedAnswer !== index}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              {selectedAnswer !== null && (
                <div className={`mt-4 ${isQuizCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isQuizCorrect ? 'Correct! Moving to next step...' : 'Incorrect. Try again!'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 