import { streamWithClaude } from "@/lib/claude";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, MessageSquarePlus, Plus, Sparkles } from "lucide-react";

export async function generateSteps(req: Request) {
  const { courseId, lessonId, courseName, lessonName, prompt } = await req.json();

  // Get additional context from Firestore
  const courseDoc = await getDoc(doc(db, "courses", courseId));
  const lessonDoc = await getDoc(doc(db, "lessons", lessonId));
  
  const courseData = courseDoc.data();
  const lessonData = lessonDoc.data();

  const messages = [
    {
      role: "system" as const,
      content: `You are an expert course creator assistant. Your task is to generate lesson steps based on the course and lesson context provided. Each step should include:
- A clear, concise title
- Detailed content in HTML format
- A relevant single-choice quiz question with options and correct answer

Course Context: ${courseData?.description || courseName}
Lesson Context: ${lessonData?.description || lessonName}

Keep the content engaging and focused on practical learning outcomes.`
    },
    {
      role: "user" as const,
      content: `I need steps for a lesson in my course:
Course: ${courseName}
Lesson: ${lessonName}

User's request: ${prompt}

Please generate the steps in this JSON format:
{
  "suggestions": [
    {
      "title": "Step Title",
      "content": "<p>Step content in HTML</p>",
      "quiz": {
        "question": "Quiz question",
        "options": ["Option 1", "Option 2", "Option 3"],
        "correctAnswer": "Option 1"
      }
    }
  ]
}`
    }
  ];

  try {
    let response = '';
    const stream = streamWithClaude(messages);
    
    for await (const chunk of stream) {
      response += chunk;
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid response format');
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Failed to generate steps' }), 
      { status: 500 }
    );
  }
} 