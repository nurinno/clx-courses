import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface Quiz {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizEditorProps {
  quiz: Quiz | null;
  onChange: (quiz: Quiz | null) => void;
}

export function QuizEditor({ quiz, onChange }: QuizEditorProps) {
  const [question, setQuestion] = useState(quiz?.question || "");
  const [options, setOptions] = useState<string[]>(quiz?.options || ["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(quiz?.correctAnswer || "");

  useEffect(() => {
    if (quiz) {
      setQuestion(quiz.question || "");
      setOptions(quiz.options?.length >= 2 ? quiz.options : ["", ""]);
      setCorrectAnswer(quiz.correctAnswer || "");
    }
  }, [quiz]);

  const handleAddOption = () => {
    if (options.length < 5) {
      const newOptions = [...options, ""];
      setOptions(newOptions);
      handleSave(undefined, newOptions);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctAnswer === options[index]) {
        setCorrectAnswer("");
      }
      handleSave(undefined, newOptions, correctAnswer === options[index] ? "" : correctAnswer);
    }
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    handleSave(undefined, newOptions);
  };

  const handleSave = (newQuestion?: string, newOptions?: string[], newCorrectAnswer?: string) => {
    const updatedQuiz: Quiz = {
      question: newQuestion ?? question,
      options: newOptions ?? options,
      correctAnswer: newCorrectAnswer ?? correctAnswer
    };
    onChange(updatedQuiz);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={question}
          onChange={(e) => {
            const newQuestion = e.target.value;
            setQuestion(newQuestion);
            handleSave(newQuestion);
          }}
          placeholder="Enter your question"
        />
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={option}
              onChange={(e) => handleUpdateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleRemoveOption(index)}
              disabled={options.length <= 2}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={correctAnswer === option ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newCorrectAnswer = option;
                setCorrectAnswer(newCorrectAnswer);
                handleSave(undefined, undefined, newCorrectAnswer);
              }}
              disabled={!option.trim()}
            >
              Correct
            </Button>
          </div>
        ))}
        {options.length < 5 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        )}
      </div>
    </div>
  );
} 