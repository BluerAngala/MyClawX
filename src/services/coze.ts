/**
 * Coze API Service
 * Handles communication with Coze API for bots and workflows
 */
import type { CozeChatRequest, CozeStreamEvent } from '@/types/coze';

const DEFAULT_API_URL = 'https://api.coze.cn';

export class CozeApiService {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl?: string) {
    this.token = token;
    this.baseUrl = baseUrl || DEFAULT_API_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Coze API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async chat(request: CozeChatRequest): Promise<string> {
    const endpoint = request.workflowId ? '/v1/workflows/chat' : '/v3/chat';
    
    const body: Record<string, unknown> = {
      additional_messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
        content_type: m.contentType || 'text',
      })),
      stream: false,
    };

    if (request.botId) {
      body.bot_id = request.botId;
    }
    if (request.workflowId) {
      body.workflow_id = request.workflowId;
    }
    if (request.conversationId) {
      body.conversation_id = request.conversationId;
    }
    if (request.parameters) {
      body.parameters = request.parameters;
    }

    const response = await this.makeRequest<{ message?: { content: string }; messages?: Array<{ content: string; type: string }> }>(
      endpoint,
      'POST',
      body
    );

    if (response.message?.content) {
      return response.message.content;
    }
    if (response.messages) {
      const answer = response.messages.find((m) => m.type === 'answer');
      if (answer) return answer.content;
    }
    return '';
  }

  async *chatStream(request: CozeChatRequest): AsyncGenerator<CozeStreamEvent> {
    const endpoint = request.workflowId ? '/v1/workflows/chat' : '/v3/chat';
    
    const body: Record<string, unknown> = {
      additional_messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
        content_type: m.contentType || 'text',
      })),
      stream: true,
    };

    if (request.botId) {
      body.bot_id = request.botId;
    }
    if (request.workflowId) {
      body.workflow_id = request.workflowId;
    }
    if (request.conversationId) {
      body.conversation_id = request.conversationId;
    }
    if (request.parameters) {
      body.parameters = request.parameters;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Coze API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          const event = line.substring(6).trim();
          const dataLine = lines[lines.indexOf(line) + 1];
          if (dataLine?.startsWith('data:')) {
            const data = dataLine.substring(5).trim();
            try {
              yield { event, data: JSON.parse(data) };
            } catch {
              yield { event, data };
            }
          }
        }
      }
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.makeRequest('/v1/bots', 'GET');
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export function createCozeService(token: string, baseUrl?: string): CozeApiService {
  return new CozeApiService(token, baseUrl);
}
