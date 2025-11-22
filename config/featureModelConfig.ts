import type { ModelConfig } from '../types';

export const DEFAULT_MODEL_CONFIG: Record<string, ModelConfig> = {
  AI_APPLY: {
    model: 'gemini-2.5-flash',
    maxTokens: 1000,
    temperature: 0.7
  },
  AI_DECISIONING: {
    model: 'gemini-3-pro-preview',
    maxTokens: 2000,
    temperature: 0.2
  },
  AI_ASSISTANT: {
    model: 'gemini-2.5-flash',
    maxTokens: 500,
    temperature: 0.9
  },
  ADDRESS_PARSING: {
    model: 'gemini-2.5-flash',
    maxTokens: 200,
    temperature: 0.1
  },
  APP_PARSING: {
    model: 'gemini-2.5-flash',
    maxTokens: 1500,
    temperature: 0.1
  }
};
