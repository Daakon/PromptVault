
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Command, Github, LayoutGrid, List, Filter, SlidersHorizontal, X, Tag, Settings } from 'lucide-react';
import { Prompt, AIModel, Category, PromptFormData, QuickFilter } from './types';
import { PromptCard } from './components/PromptCard';
import { PromptModal } from './components/PromptModal';
import { CategoryManager } from './components/CategoryManager';

// Initial Data
const INITIAL_CATEGORIES: string[] = [
  'Coding', 'Writing', 'Productivity', 'Image Gen', 'Data Analysis', 'Other'
];

const INITIAL_PROMPTS: Prompt[] = [
  {
    id: '1',
    title: 'React Component Generator',
    content: 'Act as a senior React developer. Create a reusable, accessible component using TypeScript and Tailwind CSS. Follow modern best practices, including proper prop typing and responsive design. The component to build is: [COMPONENT_NAME].',
    tags: ['react', 'typescript', 'frontend'],
    models: [AIModel.Gemini, AIModel.GPT4],
    category: 'Coding',
    isFavorite: true,
    lastUsed: Date.now()
  },
  {
    id: '2',
    title: 'Technical Blog Post',
    content: 'Write a technical blog post about [TOPIC]. The tone should be professional yet accessible. Structure the post with an engaging introduction, clear headings, code snippets where relevant, and a summary conclusion. Optimize for SEO with keywords: [KEYWORDS].',
    tags: ['writing', 'seo', 'blog'],
    models: [AIModel.Claude3, AIModel.Gemini],
    category: 'Writing',
    isFavorite: false,
    lastUsed: Date.now() - 100000
  },
  {
    id: '3',
    title: 'Python Data Analysis',
    content: 'I have a dataset containing [DATA_DESCRIPTION]. Write a Python script using Pandas and Matplotlib to clean the data, perform exploratory data analysis, and visualize the following trends: [TRENDS].',
    tags: ['python', 'data', 'pandas'],
    models: [AIModel.GPT4],
    category: 'Data Analysis',
    isFavorite: false,
    lastUsed: Date.now() - 200000
  }
];

const INITIAL_QUICK_FILTERS: QuickFilter[] = [
    { id: 'qf_1', type: 'category', value: 'Coding', label: 'Coding' },
    { id: 'qf_2', type: 'model', value: AIModel.Gemini, label: 'Gemini' }
];

function App() {
  // State
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const saved = localStorage.getItem('pv_prompts');
    return saved ? JSON.parse(saved) : INITIAL_PROMPTS;
  });

  const [categories, setCategories] = useState<string[]>(() => {
      const saved = localStorage.getItem('pv_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>(() => {
      const saved = localStorage.getItem('pv_quick_filters');
      return saved ? JSON.parse(saved) : INITIAL_QUICK_FILTERS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [selectedModel, setSelectedModel] = useState<AIModel | 'All'>('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Persistence
  useEffect(() => {
    localStorage.setItem('pv_prompts', JSON.stringify(prompts));
  }, [prompts]);
  useEffect(() => {
    localStorage.setItem('pv_categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('pv_quick_filters', JSON.stringify(quickFilters));
  }, [quickFilters]);

  // Logic
  const handleSavePrompt = (data: PromptFormData) => {
    if (editingPrompt) {
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? {
        ...p,
        ...data,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean)
      } : p));
    } else {
      const newPrompt: Prompt = {
        id: crypto.randomUUID(),
        ...data,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
        isFavorite: false,
        lastUsed: Date.now()
      };
      setPrompts(prev => [newPrompt, ...prev]);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleFavorite = (id: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Toast logic omitted for brevity
  };

  const handleAddCategory = (cat: string) => {
      setCategories(prev => [...prev, cat]);
  };

  const handleRemoveCategory = (cat: string) => {
      if(confirm(`Delete category "${cat}"? Prompts will remain.`)) {
          setCategories(prev => prev.filter(c => c !== cat));
          // If selected category was deleted, reset filter
          if(selectedCategory === cat) setSelectedCategory('All');
      }
  };

  // Quick Filters Logic
  const applyQuickFilter = (filter: QuickFilter) => {
      if (filter.type === 'category') {
          setSelectedCategory(prev => prev === filter.value ? 'All' : filter.value);
          setSelectedModel('All');
      } else if (filter.type === 'model') {
          setSelectedModel(prev => prev === filter.value ? 'All' : filter.value as AIModel);
          setSelectedCategory('All');
      } else if (filter.type === 'tag') {
          setSearchQuery(prev => prev === filter.value ? '' : filter.value);
      }
  };

  const addCurrentAsQuickFilter = () => {
      let newFilter: QuickFilter | null = null;
      
      if (selectedCategory !== 'All') {
          newFilter = { id: crypto.randomUUID(), type: 'category', value: selectedCategory, label: selectedCategory };
      } else if (selectedModel !== 'All') {
          newFilter = { id: crypto.randomUUID(), type: 'model', value: selectedModel, label: selectedModel };
      } else if (searchQuery.trim() !== '') {
          newFilter = { id: crypto.randomUUID(), type: 'tag', value: searchQuery, label: searchQuery };
      }

      if (newFilter) {
          // Avoid duplicates
          if (!quickFilters.some(qf => qf.type === newFilter!.type && qf.value === newFilter!.value)) {
            setQuickFilters(prev => [...prev, newFilter!]);
          }
      } else {
          alert("Select a category, model, or type a search term to create a quick filter.");
      }
  };

  const removeQuickFilter = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setQuickFilters(prev => prev.filter(qf => qf.id !== id));
  };

  const isFilterActive = (filter: QuickFilter) => {
      if (filter.type === 'category') return selectedCategory === filter.value;
      if (filter.type === 'model') return selectedModel === filter.value;
      if (filter.type === 'tag') return searchQuery === filter.value;
      return false;
  };

  // Filtering
  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        prompt.title.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query) ||
        prompt.tags.some(t => t.toLowerCase().includes(query));
      
      const matchesCategory = selectedCategory === 'All' || prompt.category === selectedCategory;
      const matchesModel = selectedModel === 'All' || prompt.models.includes(selectedModel as AIModel);

      return matchesSearch && matchesCategory && matchesModel;
    });
  }, [prompts, searchQuery, selectedCategory, selectedModel]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Command size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 hidden sm:block">
              PromptVault
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github size={20} />
             </a>
             <div className="h-6 w-px bg-slate-800"></div>
             <button 
                onClick={() => { setEditingPrompt(undefined); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/20 hover:scale-105"
            >
                <Plus size={18} />
                <span className="hidden sm:inline">New Prompt</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toolbar */}
        <div className="mb-8 space-y-4">
            <div className="flex flex-col gap-4 justify-between">
                {/* Search */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                        type="text"
                        placeholder="Search prompts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-200 placeholder-slate-500"
                    />
                </div>

                {/* Filters Row */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mr-2">
                            <Filter size={16} />
                        </div>
                        
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="flex-1 min-w-[140px] bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer hover:border-slate-700"
                        >
                            <option value="All">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <button
                            onClick={() => setIsCategoryManagerOpen(true)}
                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                            title="Manage Categories"
                        >
                            <Settings size={16} />
                        </button>

                        <select 
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as AIModel | 'All')}
                            className="flex-1 min-w-[120px] bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer hover:border-slate-700"
                        >
                            <option value="All">All Models</option>
                            {Object.values(AIModel).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all border border-transparent ${viewMode === 'grid' ? 'bg-slate-800 text-indigo-400 border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all border border-transparent ${viewMode === 'list' ? 'bg-slate-800 text-indigo-400 border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>
                        
                         <button
                            onClick={addCurrentAsQuickFilter}
                            className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-full bg-indigo-900/20 border border-indigo-500/30 transition-colors"
                        >
                            <Plus size={12} />
                            Save Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Filters Bar */}
            {quickFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-slate-800/50 mt-2">
                    {quickFilters.map(qf => (
                        <button
                            key={qf.id}
                            onClick={() => applyQuickFilter(qf)}
                            className={`group flex items-center gap-2 px-3 py-1 rounded-full text-xs border transition-all ${
                                isFilterActive(qf)
                                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-900/30'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                            }`}
                        >
                            {qf.type === 'tag' && <Tag size={10} />}
                            {qf.label}
                            <span 
                                onClick={(e) => removeQuickFilter(qf.id, e)}
                                className={`ml-1 p-0.5 rounded-full hover:bg-white/20 ${isFilterActive(qf) ? 'text-indigo-100' : 'text-slate-500 group-hover:text-slate-400'}`}
                            >
                                <X size={10} />
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Content Grid */}
        {filteredPrompts.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredPrompts.map(prompt => (
                <div key={prompt.id} className={viewMode === 'list' ? 'max-w-4xl mx-auto w-full' : ''}>
                    <PromptCard 
                        prompt={prompt}
                        onCopy={handleCopy}
                        onEdit={(p) => { setEditingPrompt(p); setIsModalOpen(true); }}
                        onDelete={handleDelete}
                        onToggleFavorite={handleToggleFavorite}
                    />
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 text-slate-600 mb-4">
                    <SlidersHorizontal size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-300">No prompts found</h3>
                <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
            </div>
        )}

      </main>

      <PromptModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePrompt}
        initialData={editingPrompt}
        categories={categories}
      />

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
      />
    </div>
  );
}

export default App;
