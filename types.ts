
export enum AIModel {
  Gemini = 'Gemini',
  GPT4 = 'GPT-4',
  Claude3 = 'Claude 3',
  Midjourney = 'Midjourney',
  Other = 'Other'
}

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
