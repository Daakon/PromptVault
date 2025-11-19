
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Prompt, PromptFormData, AIModel } from '../types';
import { enhancePromptLogic, suggestTagsLogic } from '../services/geminiService';

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

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

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

  const handleEnhance = async () => {
    if (!formData.content) return;
    setIsEnhancing(true);
    try {
        const enhanced = await enhancePromptLogic(formData.content);
        setFormData(prev => ({ ...prev, content: enhanced }));
    } catch (e) {
        alert("Could not enhance prompt. Check API Key.");
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleAutoTags = async () => {
      if(!formData.content) return;
      setIsSuggestingTags(true);
      try {
          const tags = await suggestTagsLogic(formData.content);
          const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
          const uniqueTags = Array.from(new Set([...currentTags, ...tags])).filter(t => t);
          setFormData(prev => ({ ...prev, tags: uniqueTags.join(', ') }));
      } catch(e) {
        console.error(e);
      } finally {
          setIsSuggestingTags(false);
      }
  }

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
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-400">Prompt Content</label>
                <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={isEnhancing || !formData.content}
                    className="flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                >
                    {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Magic Enhance
                </button>
            </div>
            <textarea
              required
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              placeholder="Describe what you want the AI to do..."
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-slate-500">
                Tip: Use "Magic Enhance" to turn a simple instruction into a structured prompt.
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-400">Tags (comma separated)</label>
                <button
                    type="button"
                    onClick={handleAutoTags}
                    disabled={isSuggestingTags || !formData.content}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                >
                    {isSuggestingTags ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    Suggest Tags
                </button>
            </div>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              placeholder="coding, react, hook..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
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
