
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Command, LayoutGrid, List, Filter, SlidersHorizontal, X, Tag, Settings, Pin, Droplet, Minus, XCircle, RefreshCcw, Move } from 'lucide-react';
import { Prompt, AIModel, Category, PromptFormData, QuickFilter, DEFAULT_MODELS } from './types';
import { PromptCard } from './components/PromptCard';
import { PromptModal } from './components/PromptModal';
import { CategoryManager } from './components/CategoryManager';
import { ModelManager } from './components/ModelManager';
import { ImportExportModal } from './components/ImportExportModal';
import { ModelManager } from './components/ModelManager';

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
    models: ['ChatGPT', 'GitHub Copilot'],
    category: 'Coding',
    isFavorite: true,
    lastUsed: Date.now()
  },
  {
    id: '2',
    title: 'Technical Blog Post',
    content: 'Write a technical blog post about [TOPIC]. The tone should be professional yet accessible. Structure the post with an engaging introduction, clear headings, code snippets where relevant, and a summary conclusion. Optimize for SEO with keywords: [KEYWORDS].',
    tags: ['writing', 'seo', 'blog'],
    models: ['Claude', 'Gemini'],
    category: 'Writing',
    isFavorite: false,
    lastUsed: Date.now() - 100000
  },
  {
    id: '3',
    title: 'Python Data Analysis',
    content: 'I have a dataset containing [DATA_DESCRIPTION]. Write a Python script using Pandas and Matplotlib to clean the data, perform exploratory data analysis, and visualize the following trends: [TRENDS].',
    tags: ['python', 'data', 'pandas'],
    models: ['GPT Codex', 'Claude Code', 'MS Copilot'],
    category: 'Data Analysis',
    isFavorite: false,
    lastUsed: Date.now() - 200000
  }
];

const INITIAL_QUICK_FILTERS: QuickFilter[] = [
    { id: 'qf_1', type: 'category', value: 'Coding', label: 'Coding' },
    { id: 'qf_2', type: 'model', value: 'Gemini', label: 'Gemini' }
];

const DESKTOP_READY_EVENT = 'promptvault-desktop-ready';
const LEGACY_MODEL_RENAMES: Record<string, AIModel> = {
  'GPT-4': 'ChatGPT',
  'Claude 3': 'Claude',
};
const REMOVED_MODELS = new Set<AIModel>(['Midjourney']);
const REQUIRED_MODELS = new Set<AIModel>(['MS Copilot', 'GitHub Copilot']);

const parseStoredJson = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const normalizeModelName = (value: unknown): AIModel | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const renamed = LEGACY_MODEL_RENAMES[trimmed] ?? trimmed;
  return REMOVED_MODELS.has(renamed) ? null : renamed;
};

const dedupeModels = (values: AIModel[]): AIModel[] => Array.from(new Set(values));

const migrateStoredModels = (value: unknown): AIModel[] => {
  if (!Array.isArray(value)) return DEFAULT_MODELS;
  const migrated = dedupeModels(
    value
      .map(normalizeModelName)
      .filter((model): model is AIModel => Boolean(model))
  );
  const withRequired = dedupeModels([
    ...migrated,
    ...Array.from(REQUIRED_MODELS).filter((model) => DEFAULT_MODELS.includes(model)),
  ]);
  return withRequired.length ? withRequired : DEFAULT_MODELS;
};

const migratePromptModelSelection = (value: unknown): AIModel[] => {
  if (!Array.isArray(value)) return [DEFAULT_MODELS[0] ?? 'Other'];
  const migrated = dedupeModels(
    value
      .map(normalizeModelName)
      .filter((model): model is AIModel => Boolean(model))
  );
  return migrated.length ? migrated : [DEFAULT_MODELS[0] ?? 'Other'];
};

const migrateStoredPrompts = (value: unknown): Prompt[] => {
  if (!Array.isArray(value)) return INITIAL_PROMPTS;
  return value
    .filter((item): item is Prompt => Boolean(item) && typeof item === 'object')
    .map((prompt) => ({
      ...prompt,
      models: migratePromptModelSelection(prompt.models),
    }));
};

const migrateStoredQuickFilters = (value: unknown): QuickFilter[] => {
  if (!Array.isArray(value)) return INITIAL_QUICK_FILTERS;

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];

    const filter = item as QuickFilter;
    if (filter.type !== 'model') return [filter];

    const migratedValue = normalizeModelName(filter.value);
    if (!migratedValue) return [];

    return [{
      ...filter,
      value: migratedValue,
      label: filter.label === filter.value ? migratedValue : filter.label,
    }];
  });
};

function App() {
  // State
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    return migrateStoredPrompts(parseStoredJson('pv_prompts'));
  });

  const [categories, setCategories] = useState<string[]>(() => {
      const saved = parseStoredJson('pv_categories');
      return Array.isArray(saved) ? saved : INITIAL_CATEGORIES;
  });

  const [models, setModels] = useState<AIModel[]>(() => {
      return migrateStoredModels(parseStoredJson('pv_models'));
  });

  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>(() => {
      return migrateStoredQuickFilters(parseStoredJson('pv_quick_filters'));
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [selectedModel, setSelectedModel] = useState<AIModel | 'All'>('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [desktopAlwaysOnTop, setDesktopAlwaysOnTop] = useState<boolean | null>(null);
  const [desktopOpacity, setDesktopOpacity] = useState<number | null>(null);
  const [isDesktopControlsOpen, setIsDesktopControlsOpen] = useState(false);
  const isElectronShell = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
  const [hasDesktopBridge, setHasDesktopBridge] = useState(
    () => typeof window !== 'undefined' && (Boolean(window.desktop) || Boolean(window.promptvaultDesktopReady) || isElectronShell)
  );
  const desktopControlsRef = useRef<HTMLDivElement | null>(null);
  const isDesktopShell = isElectronShell || hasDesktopBridge;

  // Persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const attachFromRequire = () => {
      if (!window.desktop && window.require) {
        try {
          const electron = window.require('electron');
          if (electron?.ipcRenderer) {
            const ipcRenderer = electron.ipcRenderer;
            window.desktop = {
              version: 'renderer-polyfill',
              toggleAlwaysOnTop: () => ipcRenderer.invoke('desktop:toggle-always-on-top'),
              getAlwaysOnTop: () => ipcRenderer.invoke('desktop:get-always-on-top'),
              onAlwaysOnTopChanged: (callback) => {
                if (typeof callback !== 'function') return () => {};
                const handler = (_event: unknown, value: boolean) => callback(value);
                ipcRenderer.on('desktop:always-on-top', handler);
                return () => ipcRenderer.removeListener('desktop:always-on-top', handler);
              },
              setOpacity: (value) => ipcRenderer.invoke('desktop:set-opacity', value),
              getOpacity: () => ipcRenderer.invoke('desktop:get-opacity'),
              onOpacityChanged: (callback) => {
                if (typeof callback !== 'function') return () => {};
                const handler = (_event: unknown, value: number) => callback(value);
                ipcRenderer.on('desktop:opacity', handler);
                return () => ipcRenderer.removeListener('desktop:opacity', handler);
              },
              minimizeWindow: () => ipcRenderer.invoke('desktop:minimize'),
              closeWindow: () => ipcRenderer.invoke('desktop:close')
            };
            window.promptvaultDesktopReady = true;
            setHasDesktopBridge(true);
          }
        } catch (error) {
          console.error('Failed to polyfill desktop bridge', error);
        }
      }
    };

    attachFromRequire();

    const handleReady = () => {
      setHasDesktopBridge(true);
    };
    window.addEventListener(DESKTOP_READY_EVENT, handleReady);

    if (window.desktop || window.promptvaultDesktopReady) {
      setHasDesktopBridge(true);
    }

    const interval = window.setInterval(() => {
      if (window.desktop || window.promptvaultDesktopReady) {
        setHasDesktopBridge(true);
        window.clearInterval(interval);
      }
    }, 250);

    return () => {
      window.removeEventListener(DESKTOP_READY_EVENT, handleReady);
      window.clearInterval(interval);
    };
  }, [isElectronShell]);

  useEffect(() => {
    localStorage.setItem('pv_prompts', JSON.stringify(prompts));
  }, [prompts]);
  useEffect(() => {
    localStorage.setItem('pv_categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('pv_quick_filters', JSON.stringify(quickFilters));
  }, [quickFilters]);
  useEffect(() => {
    localStorage.setItem('pv_models', JSON.stringify(models));
  }, [models]);

  useEffect(() => {
    if (!hasDesktopBridge || !window.desktop?.getAlwaysOnTop) {
      return;
    }
    let unsubscribe: (() => void) | void;
    window.desktop.getAlwaysOnTop()
      .then(value => setDesktopAlwaysOnTop(value))
      .catch(() => setDesktopAlwaysOnTop(false));
    if (window.desktop.onAlwaysOnTopChanged) {
      const maybe = window.desktop.onAlwaysOnTopChanged((value) => setDesktopAlwaysOnTop(value));
      if (typeof maybe === 'function') {
        unsubscribe = maybe;
      }
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [hasDesktopBridge]);

  useEffect(() => {
    if (!hasDesktopBridge || !window.desktop?.getOpacity) {
      return;
    }
    let unsubscribe: (() => void) | void;
    window.desktop.getOpacity()
      .then(value => setDesktopOpacity(value))
      .catch(() => setDesktopOpacity(1));
    if (window.desktop.onOpacityChanged) {
      const maybe = window.desktop.onOpacityChanged((value) => setDesktopOpacity(value));
      if (typeof maybe === 'function') {
        unsubscribe = maybe;
      }
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [hasDesktopBridge]);

  useEffect(() => {
    if (!isDesktopControlsOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (desktopControlsRef.current && !desktopControlsRef.current.contains(event.target as Node)) {
        setIsDesktopControlsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isDesktopControlsOpen]);

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

  const handleAddModel = (model: string) => {
    setModels(prev => [...prev, model]);
  };

  const handleRemoveModel = (model: string) => {
    setModels(prev => prev.filter(m => m !== model));
    setQuickFilters(prev => prev.filter(qf => !(qf.type === 'model' && qf.value === model)));
    if (selectedModel === model) {
      setSelectedModel('All');
    }
  };

  const handleToggleDesktopPin = async () => {
    if (!window.desktop?.toggleAlwaysOnTop) {
      alert('Desktop controls are still starting up—try again in a moment.');
      return;
    }
    try {
      const nextValue = await window.desktop.toggleAlwaysOnTop();
      setDesktopAlwaysOnTop(nextValue);
    } catch (error) {
      console.error('Failed to toggle desktop pin state', error);
    }
  };

  const handleDesktopOpacityChange = async (percent: number) => {
    if (!window.desktop?.setOpacity) {
      alert('Desktop controls are still starting up—try again in a moment.');
      return;
    }
    const normalized = Math.min(1, Math.max(0.4, percent / 100));
    try {
      const value = await window.desktop.setOpacity(normalized);
      setDesktopOpacity(value);
    } catch (error) {
      console.error('Failed to update desktop opacity', error);
    }
  };

  const handleMinimizeWindow = () => {
    window.desktop?.minimizeWindow?.();
  };

  const handleCloseWindow = () => {
    window.desktop?.closeWindow?.();
  };

  const handleImportPrompts = (incoming: Prompt[]) => {
    setPrompts(prev => {
      const existing = new Map(prev.map(p => [p.id, p]));
      const normalized = incoming.map(prompt => {
        const id = prompt.id && !existing.has(prompt.id) ? prompt.id : crypto.randomUUID();
        return {
          id,
          title: prompt.title || 'Untitled Prompt',
          content: prompt.content || '',
          tags: Array.isArray(prompt.tags) ? prompt.tags : [],
          models: Array.isArray(prompt.models) && prompt.models.length ? prompt.models : [models[0] ?? 'Custom'],
          category: prompt.category || categories[0] || 'General',
          isFavorite: Boolean(prompt.isFavorite),
          lastUsed: prompt.lastUsed ?? Date.now()
        } as Prompt;
      });
      return [...normalized, ...prev];
    });
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

  const opacityPercent = desktopOpacity == null ? 100 : Math.round(desktopOpacity * 100);
  const dragRegionStyle = isDesktopShell ? { WebkitAppRegion: 'drag' as const } : undefined;
  const noDragRegionStyle = isDesktopShell ? { WebkitAppRegion: 'no-drag' as const } : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800" style={dragRegionStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <div className="flex items-center gap-3" style={noDragRegionStyle}>
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Command size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 hidden sm:block">
              Prompt Vault
            </h1>
          </div>

          {isDesktopShell && (
            <div
              aria-hidden="true"
              className="flex-1 flex items-center justify-center h-10 rounded-lg border border-dashed border-slate-800/70 text-[11px] font-semibold tracking-wide uppercase text-slate-500/80 hover:text-slate-200 hover:border-slate-700/80 transition-colors cursor-grab active:cursor-grabbing select-none px-3 gap-2"
              style={dragRegionStyle}
              title="Drag to move the window"
            >
              <Move size={14} className="opacity-70" />
              Drag window
            </div>
          )}

          <div className="ml-auto flex items-center gap-4" style={noDragRegionStyle}>
            {isDesktopShell && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleDesktopPin}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${desktopAlwaysOnTop ? 'bg-amber-500/20 text-amber-200 border-amber-400/60' : 'text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-500'}`}
                  title={desktopAlwaysOnTop ? 'Window is pinned on top' : 'Keep window on top'}
                >
                  <Pin size={14} className={desktopAlwaysOnTop ? 'fill-current' : ''} />
                  <span className="hidden md:inline">{desktopAlwaysOnTop ? 'Pinned' : 'Pin'}</span>
                </button>
                <div className="relative" ref={desktopControlsRef}>
                  <button
                    type="button"
                    onClick={() => setIsDesktopControlsOpen(prev => !prev)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                    title="Adjust window transparency"
                  >
                    <Droplet size={14} />
                    <span className="hidden md:inline">Opacity</span>
                  </button>
                  {isDesktopControlsOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span>Transparency</span>
                        <span>{opacityPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        value={Math.max(40, opacityPercent)}
                        onChange={(e) => handleDesktopOpacityChange(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                        <span>More transparent</span>
                        <span>Opaque</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDesktopOpacityChange(100)}
                        className="mt-4 w-full text-center text-xs text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg py-1.5"
                      >
                        Reset to 100%
                      </button>
                    </div>
                  )}
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
              </div>
            )}
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              <RefreshCcw size={16} />
              <span className="hidden sm:inline text-sm">Import / Export</span>
            </button>
            {isDesktopShell && (
               <div className="flex items-center gap-2" style={noDragRegionStyle}>
                 <button
                   onClick={handleMinimizeWindow}
                   className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                   title="Minimize"
                 >
                   <Minus size={16} />
                 </button>
                 <button
                   onClick={handleCloseWindow}
                   className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-red-500/80 transition-colors"
                   title="Close"
                 >
                   <XCircle size={16} />
                 </button>
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toolbar */}
        <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Search & Filters</span>
              <button
                onClick={() => setIsFiltersOpen(prev => !prev)}
                className="px-3 py-1 rounded-lg border border-slate-800 hover:border-slate-600 hover:text-white transition-colors"
              >
                {isFiltersOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {isFiltersOpen && (
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
                            {models.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>

                        <button
                            onClick={() => setIsModelManagerOpen(true)}
                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                            title="Manage Models"
                        >
                            <SlidersHorizontal size={16} />
                        </button>
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
            )}

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

      <button
        onClick={() => { setEditingPrompt(undefined); setIsModalOpen(true); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-900/40 flex items-center justify-center text-2xl"
        aria-label="Create prompt"
      >
        <Plus size={24} />
      </button>

      <PromptModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePrompt}
        initialData={editingPrompt}
        categories={categories}
        models={models}
      />

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
      />

      <ModelManager
        isOpen={isModelManagerOpen}
        onClose={() => setIsModelManagerOpen(false)}
        models={models}
        onAddModel={handleAddModel}
        onRemoveModel={handleRemoveModel}
      />

      <ImportExportModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        prompts={filteredPrompts}
        onImport={handleImportPrompts}
      />
    </div>
  );
}

export default App;
