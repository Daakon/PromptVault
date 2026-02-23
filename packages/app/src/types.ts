
export type AIModel = string;

export const DEFAULT_MODELS: AIModel[] = [
  'Gemini',
  'ChatGPT',
  'Claude',
  'GPT Codex',
  'Claude Code',
  'MS Copilot',
  'GitHub Copilot',
  'Other'
];

export type Category = string;

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  models: AIModel[];
  category: Category;
  isFavorite: boolean;
  lastUsed: number; // Timestamp
}

export interface PromptFormData {
  title: string;
  content: string;
  tags: string;
  models: AIModel[];
  category: Category;
}

export interface QuickFilter {
  id: string;
  type: 'category' | 'model' | 'tag';
  value: string;
  label: string;
}
