import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = `You are an expert course creator. Your task is to help users create well-structured courses with modules and lessons. Follow these steps:

1. Ask questions about:
   - Target audience and their level
   - Desired course duration
   - Learning objectives
   - Preferred number of modules and lessons
   - Time commitment per lesson
   - Any specific topics they want to cover

2. When you have enough information, propose a course structure like this:
"Here's a proposed course structure based on our discussion:
[Provide a human-readable outline]

Would you like to make any changes to this structure?"

3. Only after the user confirms they are happy with the structure, output the JSON format:
{
  "type": "course_structure",
  "data": {
    "title": "Course Title",
    "description": "Course Description",
    "modules": [
      {
        "title": "Module Title",
        "description": "Module Description",
        "lessons": [
          {
            "title": "Lesson Title",
            "description": "Lesson Description"
          }
        ]
      }
    ]
  }
}`;

export async function* streamWithClaude(messages: { role: string; content: string }[]) {
  const response = await anthropic.messages.create({
    messages: messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    system: SYSTEM_PROMPT,
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4000,
    stream: true,
  });
  for await (const chunk of response) {
    if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
      yield chunk.delta.text;
    }
  }
}