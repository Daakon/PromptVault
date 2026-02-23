import React, { useState, useMemo } from 'react';
import { Prompt } from '../types';
import { X, Download, Upload, CheckSquare, Square, RefreshCcw } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: Prompt[];
  onImport: (prompts: Prompt[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  prompts,
  onImport
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const selectablePrompts = useMemo(() => prompts.map(p => p.id), [prompts]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(selectablePrompts);
      setStatus(null);
      setImportText('');
    }
  }, [isOpen, selectablePrompts]);

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const areAllSelected = selectedIds.length === selectablePrompts.length && selectablePrompts.length > 0;

  const handleSelectAll = () => {
    setSelectedIds(areAllSelected ? [] : selectablePrompts);
  };

  const exportSelected = () => {
    if (selectedIds.length === 0) {
      setStatus('Select at least one prompt to export.');
      return;
    }
    const selectedPrompts = prompts.filter(p => selectedIds.includes(p.id));
    const data = JSON.stringify(selectedPrompts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promptvault-export-${selectedPrompts.length}.json`;
    link.click();
    setStatus(`Exported ${selectedPrompts.length} prompt(s).`);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        setStatus('Import expects a JSON array.');
        return;
      }
      onImport(parsed as Prompt[]);
      setStatus(`Imported ${parsed.length} prompt(s).`);
      setImportText('');
    } catch (error) {
      setStatus(`Import failed: ${(error as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <RefreshCcw size={18} className="text-indigo-400" />
            Import / Export Prompts
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 flex-1 overflow-hidden">
          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
              <span>Filtered prompts: {prompts.length}</span>
              <button onClick={handleSelectAll} className="text-indigo-300 hover:text-white flex items-center gap-1">
                {areAllSelected ? 'Clear All' : 'Select All'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {prompts.map(prompt => {
                const selected = selectedIds.includes(prompt.id);
                return (
                  <button
                    key={prompt.id}
                    onClick={() => toggleSelection(prompt.id)}
                    className={`w-full flex items-center gap-2 text-left p-3 rounded-lg border transition-colors ${
                      selected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-100' : 'border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                    <div>
                      <p className="text-sm font-semibold">{prompt.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{prompt.content}</p>
                    </div>
                  </button>
                );
              })}
              {prompts.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8">No prompts match the current filters.</p>
              )}
            </div>
            <button
              onClick={exportSelected}
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
            >
              <Download size={16} />
              Export Selected
            </button>
          </div>

          <div className="p-6 flex flex-col">
            <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Upload size={16} className="text-indigo-300" />
              Import JSON
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='Paste an array of prompts e.g. [{"title":"...","content":"..."}]'
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-white disabled:opacity-50 text-sm"
            >
              Import Prompts
            </button>
          </div>
        </div>

        {status && (
          <div className="p-4 border-t border-slate-800 text-xs text-indigo-200">
            {status}
          </div>
        )}
      </div>
    </div>
  );
};
