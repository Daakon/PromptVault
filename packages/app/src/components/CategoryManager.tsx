
import React, { useState } from 'react';
import { X, Plus, Trash2, Folder } from 'lucide-react';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onRemoveCategory
}) => {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Folder size={20} className="text-indigo-400" />
            Manage Categories
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleAdd} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newCategory.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus size={20} />
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800 group hover:border-slate-700 transition-all">
                <span className="text-slate-300 font-medium">{category}</span>
                <button
                  onClick={() => onRemoveCategory(category)}
                  className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                  title="Delete category"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {categories.length === 0 && (
                <p className="text-center text-slate-500 py-4">No categories found.</p>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
            <p className="text-xs text-slate-500 text-center">
                Deleting a category will not delete prompts, but they will be marked as 'Uncategorized' if edited.
            </p>
        </div>
      </div>
    </div>
  );
};
