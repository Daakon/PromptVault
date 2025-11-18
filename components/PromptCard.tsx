
import React, { useState } from 'react';
import { Prompt, AIModel } from '../types';
import { Copy, Edit2, Trash2, Star, Check, Terminal, PenTool, Briefcase, Image, Database, Layers, Hash } from 'lucide-react';

interface PromptCardProps {
  prompt: Prompt;
  onCopy: (text: string) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const getCategoryIcon = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes('code') || normalized.includes('dev') || normalized.includes('react') || normalized.includes('script')) 
    return <Terminal size={16} className="text-blue-400" />;
  if (normalized.includes('writ') || normalized.includes('blog') || normalized.includes('content') || normalized.includes('copy')) 
    return <PenTool size={16} className="text-green-400" />;
  if (normalized.includes('prod') || normalized.includes('work') || normalized.includes('business')) 
    return <Briefcase size={16} className="text-yellow-400" />;
  if (normalized.includes('image') || normalized.includes('art') || normalized.includes('design')) 
    return <Image size={16} className="text-pink-400" />;
  if (normalized.includes('data') || normalized.includes('analy') || normalized.includes('sql')) 
    return <Database size={16} className="text-purple-400" />;
  
  // Default for custom categories
  return <Hash size={16} className="text-indigo-400" />;
};

const getModelColor = (model: AIModel) => {
    switch(model) {
        case AIModel.Gemini: return 'bg-blue-900/50 text-blue-200 border-blue-700';
        case AIModel.GPT4: return 'bg-green-900/50 text-green-200 border-green-700';
        case AIModel.Claude3: return 'bg-orange-900/50 text-orange-200 border-orange-700';
        default: return 'bg-slate-800 text-slate-300 border-slate-600';
    }
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onCopy, onEdit, onDelete, onToggleFavorite }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/50 transition-all duration-300 shadow-lg hover:shadow-xl flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
             {getCategoryIcon(prompt.category)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 line-clamp-1">{prompt.title}</h3>
            <div className="flex gap-2 mt-1">
                {prompt.models.map(m => (
                    <span key={m} className={`text-[10px] px-1.5 py-0.5 rounded border ${getModelColor(m)}`}>
                        {m}
                    </span>
                ))}
            </div>
          </div>
        </div>
        <button 
            onClick={() => onToggleFavorite(prompt.id)}
            className={`p-1.5 rounded-md transition-colors ${prompt.isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`}
        >
            <Star size={16} fill={prompt.isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex-grow bg-slate-900/50 rounded-lg p-3 mb-4 border border-slate-800 font-mono text-sm text-slate-300 overflow-hidden relative group-hover:border-slate-700 transition-colors">
        <p className="line-clamp-4 opacity-90">{prompt.content}</p>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-900/50 to-transparent" />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {prompt.tags.map(tag => (
          <span key={tag} className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
            #{tag}
          </span>
        ))}
        <span className="text-[10px] text-slate-600 px-1.5 py-0.5 rounded border border-slate-800">
            {prompt.category}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex gap-2">
            <button 
                onClick={() => onEdit(prompt)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/20 transition-colors"
                title="Edit"
            >
                <Edit2 size={16} />
            </button>
            <button 
                onClick={() => onDelete(prompt.id)}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                title="Delete"
            >
                <Trash2 size={16} />
            </button>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            copied 
            ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};
