import axios from 'axios';
import { EventEmitter } from 'events';

interface GroqChatCompletionParams {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqService extends EventEmitter {
  private baseUrl: string;
  private apiKey: string;
  
  constructor(apiKey: string) {
    super();
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.apiKey = apiKey;
    
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Groq API key is required but was not provided or is empty');
    }
    
    console.log(`GroqService initialized with API key: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
  }
  
  async chatCompletion(
    messages: GroqChatCompletionParams['messages'], 
    model: string = 'meta-llama/llama-4-maverick-17b-128e-instruct',
    temperature: number = 0.7,
    maxTokens: number = 4000
  ): Promise<string> {
    try {
      const response = await axios.post<GroqChatResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Groq API Error:', error.response.status, error.response.data);
          throw new Error(`Groq API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          console.error('Groq API Error: No response received', error.request);
          throw new Error('No response received from Groq API');
        } else {
          console.error('Groq API Error:', error.message);
          throw new Error(`Error setting up request: ${error.message}`);
        }
      } else {
        console.error('Unexpected error:', error);
        throw new Error(`Unexpected error: ${String(error)}`);
      }
    }
  }

  async compoundQuestion(question: string): Promise<string> {
    return this.chatCompletion(
      [
        { role: 'system', content: 'You are a helpful research assistant.' },
        { role: 'user', content: question }
      ],
      'compound-beta',
      0.5,
      4000
    );
  }

  async llamaQuestion(question: string): Promise<string> {
    return this.chatCompletion(
      [
        { role: 'system', content: 'You are a helpful research assistant.' },
        { role: 'user', content: question }
      ],
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      0.7,
      4000
    );
  }

  async processPrompt(prompt: string, modelType: 'compound' | 'llama' | 'combined', forceModel?: 'llama' | 'compound'): Promise<string> {
    // If a specific model is forced (for hybrid approach), use that
    if (forceModel === 'llama') {
      return this.llamaQuestion(prompt);
    } else if (forceModel === 'compound') {
      return this.compoundQuestion(prompt);
    }
    
    // Otherwise use the model based on the general modelType
    if (modelType === 'compound') {
      return this.compoundQuestion(prompt);
    } else if (modelType === 'llama') {
      return this.llamaQuestion(prompt);
    } else {
      // For combined, we'll default to Compound unless specified differently
      return this.compoundQuestion(prompt);
    }
  }
}
