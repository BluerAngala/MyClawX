/**
 * Coze Skill Type Definitions
 * Types for Coze bot and workflow integration
 */

export type CozeSkillType = 'bot' | 'workflow';

export interface CozeSkillConfig {
  id: string;
  name: string;
  description: string;
  type: CozeSkillType;
  botId?: string;
  workflowId?: string;
  apiToken: string;
  apiUrl?: string;
  icon?: string;
  enabled: boolean;
  parameters?: CozeSkillParameter[];
  createdAt: number;
  updatedAt: number;
}

export interface CozeSkillParameter {
  key: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  defaultValue?: string;
}

export interface CozeChatMessage {
  role: 'user' | 'assistant';
  content: string;
  contentType?: 'text' | 'object_string';
}

export interface CozeChatRequest {
  botId?: string;
  workflowId?: string;
  messages: CozeChatMessage[];
  conversationId?: string;
  parameters?: Record<string, string>;
  stream?: boolean;
}

export interface CozeChatResponse {
  messageId: string;
  conversationId: string;
  content: string;
  done: boolean;
  debugUrl?: string;
}

export interface CozeStreamEvent {
  event: string;
  data: unknown;
}
