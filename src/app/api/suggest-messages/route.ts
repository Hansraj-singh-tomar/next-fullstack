import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

export async function POST(req: Request) {
  try {
    const prompt =
      "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform, like Qooh.me, and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What’s a hobby you’ve recently started?||If you could have dinner with any historical figure, who would it be?||What’s a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment.";

    // Stream the response directly from OpenAI
    const result = streamText({
      model: openai('gpt-4-turbo'),
      // model: 'gpt-4-turbo',
      prompt, // Provide the prompt
      maxTokens: 100,
    });

    return result.toDataStreamResponse();
  } catch (error) {
      console.error('Error while processing OpenAI request:', error);

      // Narrowing the error type using type guards
      if (error instanceof Error) {
        if (error.name === 'APIError') {
          // Handle specific API errors
          return new Response(
            JSON.stringify({
              success: false,
              error: 'OpenAI API error occurred',
              details: error.message,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          // Handle other general errors
          return new Response(
            JSON.stringify({
              success: false,
              error: 'An unexpected error occurred',
              details: error.message,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // If the error is not an instance of Error, return a generic message
      return new Response(
        JSON.stringify({
          success: false,
          error: 'An unknown error occurred',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
}
