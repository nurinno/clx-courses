import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true
});

interface StreamWithClaudeParams {
  messages: { role: string; content: string }[];
  system?: string;
}

export async function* streamWithClaude({ messages, system }: StreamWithClaudeParams) {
  try {
    const response = await anthropic.messages.create({
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      system: system || SYSTEM_PROMPT,
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      stream: true,
    });

    for await (const chunk of response) {
      if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
        yield chunk.delta.text;
      }
    }
  } catch (error) {
    console.error('Error while calling the API:', error);
    throw error;
  }
}

// Default system prompt for course creation
export const SYSTEM_PROMPT = `You are an expert course creator. Your task is to help users create well-structured courses with modules and lessons. Follow these steps:

1. Maintain context from the entire conversation to provide consistent and relevant responses.

2. Ask questions about:
   - Target audience and their level
   - Preferred number of modules and lessons
   - Learning objectives
   - Any specific topics they want to cover

3. When you have enough information, propose a course structure like this:
"Here's a proposed course structure based on our discussion:
- **Course Title**: [Title]
- **Description**: [Description]
- **Modules**:
  - **Module 1**: [Module Title]
    - **Description**: [Module Description]
    - **Lessons**:
      - **Lesson 1**: [Lesson Title]
        - **Description**: [Lesson Description]

Would you like to make any changes to this structure?"

4. Format all your responses in Markdown. Use appropriate Markdown syntax for headings, lists, and any other formatting.

5. Only after the user confirms they are happy with the structure, output the JSON format:
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