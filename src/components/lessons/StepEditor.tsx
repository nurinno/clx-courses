import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Step } from "@/types/course";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface StepEditorProps {
  step?: Step;
  onClose: () => void;
  onDelete?: (stepId: string) => void;
  index?: number;
}

export function StepEditor({ 
  step, 
  onClose, 
  onDelete,
  index 
}: StepEditorProps) {
  const [name, setName] = useState(step?.name || "");
  const [content, setContent] = useState(step?.content || "");
  const [question, setQuestion] = useState(step?.quiz?.question || "");
  const [options, setOptions] = useState<string[]>(step?.quiz?.options || ["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(step?.quiz?.correctAnswer || "");
  const [activeTab, setActiveTab] = useState("content");

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctAnswer === options[index]) {
        setCorrectAnswer("");
      }
    }
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleDelete = async () => {
    if (!step || !onDelete) return;
    
    if (window.confirm("Are you sure you want to delete this step?")) {
      try {
        await deleteDoc(doc(db, "steps", step.id));
        onDelete(step.id);
      } catch (error) {
        console.error("Error deleting step:", error);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step) return;

    const stepData = {
      name: name.trim(),
      content: content.trim(),
      quiz: question.trim() && correctAnswer
        ? {
            question: question.trim(),
            options: options.filter(opt => opt.trim()),
            correctAnswer
          }
        : null,
      updatedAt: new Date(),
    };

    try {
      await updateDoc(doc(db, "steps", step.id), stepData);
      onClose();
    } catch (error) {
      console.error("Error saving step:", error);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="name">Step {index ? index + 1 : ""}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter step name"
                required
              />
            </div>
            {step && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="ml-4"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
              <TabsTrigger 
                value="content" 
                className={cn(
                  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  "px-4 h-12"
                )}
              >
                Content
              </TabsTrigger>
              <TabsTrigger 
                value="quiz" 
                className={cn(
                  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  "px-4 h-12"
                )}
              >
                Quiz
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4 mt-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter step content"
                rows={15}
              />
            </TabsContent>

            <TabsContent value="quiz" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter quiz question"
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
                        ×
                      </Button>
                      <Button
                        type="button"
                        variant={correctAnswer === option ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCorrectAnswer(option)}
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
                    >
                      Add Option
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {step ? "Update" : "Create"} Step
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 