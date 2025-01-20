import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Step } from "@/types/course";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

interface StepEditorProps {
  lessonId: string;
  step?: Step;
  stepsCount: number;
  onClose: () => void;
}

export function StepEditor({ lessonId, step, stepsCount, onClose }: StepEditorProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const stepData = {
      lessonId,
      name: name.trim(),
      content: content.trim() || "",
      order: step?.order ?? stepsCount,
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
      if (step) {
        await updateDoc(doc(db, "steps", step.id), stepData);
      } else {
        await addDoc(collection(db, "steps"), {
          ...stepData,
          createdAt: new Date(),
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving step:", error);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Step Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter step name"
              required
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                />
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="space-y-4">
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