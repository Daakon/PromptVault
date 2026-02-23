// Local-only compatibility shim retained to avoid import-path breakage in downstream code.
// No external services are called.

export const enhancePromptLogic = async (roughPrompt: string): Promise<string> => {
  return roughPrompt;
};

export const suggestTagsLogic = async (_content: string): Promise<string[]> => {
  return [];
};
