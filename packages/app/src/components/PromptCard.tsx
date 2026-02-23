
import React, { useState } from 'react';
import { Prompt, AIModel } from '../types';
import { Copy, Edit2, Trash2, Star, Check, Terminal, PenTool, Briefcase, Image, Database, Hash } from 'lucide-react';

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

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onCopy, onEdit, onDelete, onToggleFavorite }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
             {getCategoryIcon(prompt.category)}
          </div>
          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">{prompt.category}</p>
            <h3 className="font-semibold text-slate-100 text-sm line-clamp-1">{prompt.title}</h3>
          </div>
        </div>
        <button 
            onClick={() => onToggleFavorite(prompt.id)}
            className={`p-1.5 rounded-md transition-colors ${prompt.isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'}`}
        >
            <Star size={14} fill={prompt.isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="relative bg-slate-950/60 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 min-h-[120px]">
        <p className="line-clamp-5 leading-relaxed">{prompt.content}</p>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-slate-900/70 text-slate-300 hover:bg-slate-800"
            title="Copy prompt"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => onEdit(prompt)}
            className="p-1.5 rounded-md bg-slate-900/70 text-slate-300 hover:bg-slate-800"
            title="Edit prompt"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(prompt.id)}
            className="p-1.5 rounded-md bg-slate-900/70 text-slate-300 hover:bg-slate-800"
            title="Delete prompt"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
