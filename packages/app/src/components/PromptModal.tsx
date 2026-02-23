
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Prompt, PromptFormData, AIModel } from '../types';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PromptFormData) => void;
  initialData?: Prompt;
  categories: string[];
  models: AIModel[];
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onSave, initialData, categories, models }) => {
  // Helper to safely get a default category
  const defaultCategory = categories.length > 0 ? categories[0] : 'General';
  const defaultModel = models.length > 0 ? models[0] : 'Custom';

  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    content: '',
    tags: '',
    models: [defaultModel],
    category: defaultCategory
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          content: initialData.content,
          tags: initialData.tags.join(', '),
          models: initialData.models,
          category: initialData.category
        });
      } else {
        setFormData({
            title: '',
            content: '',
            tags: '',
            models: [defaultModel],
            category: defaultCategory
        });
      }
    }
  }, [isOpen, initialData, categories, defaultCategory, defaultModel]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const toggleModel = (model: AIModel) => {
    setFormData(prev => {
      const models = prev.models.includes(model)
        ? prev.models.filter(m => m !== model)
        : [...prev.models, model];
      return { ...prev, models: models.length ? models : [defaultModel] }; // Ensure at least one
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">
            {initialData ? 'Edit Prompt' : 'New Prompt'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-slate-400">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Python Bug Fixer"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-400">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Models */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Compatible Models</label>
            <div className="flex flex-wrap gap-2">
              {models.length === 0 && (
                <span className="text-xs text-slate-500">Add models from the dashboard to tag compatibility.</span>
              )}
              {models.map(model => (
                <button
                  key={model}
                  type="button"
                  onClick={() => toggleModel(model)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    formData.models.includes(model)
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Prompt Content</label>
            <textarea
              required
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              placeholder="Describe what you want this prompt to do..."
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-slate-500">
                PromptVault runs fully locally. Enter and refine prompt text manually.
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              placeholder="coding, react, hook..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500">
              Add tags manually for local organization.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-900/20 transition-all"
            >
              {initialData ? 'Save Changes' : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
