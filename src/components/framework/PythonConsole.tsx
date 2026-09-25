import React, { useState } from 'react';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Trash2, 
  BookOpen, 
  Check, 
  Code2, 
  Cpu
} from 'lucide-react';
import { PRESET_RECIPES, executeConsoleCode, ConsoleRecipe } from '../../framework/pythonConsole';

export const PythonConsole: React.FC = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<ConsoleRecipe>(PRESET_RECIPES[0]);
  const [language, setLanguage] = useState<'python' | 'javascript'>('python');
  const [code, setCode] = useState<string>(PRESET_RECIPES[0].code);
  const [output, setOutput] = useState<string>(
    '# Python & JavaScript Database Abstraction Layer Console\n# Click "Execute Code" to run the active script against the live database.\n'
  );
  const [error, setError] = useState<string | null>(null);

  const handleSelectRecipe = (r: ConsoleRecipe) => {
    setSelectedRecipe(r);
    setLanguage(r.language);
    setCode(r.code);
    setError(null);
  };

  const handleRun = () => {
    setError(null);
    const res = executeConsoleCode(code, language);
    if (res.error) {
      setError(res.error);
      setOutput((prev) => `${prev}\n\n[FAILED]\n${res.error}`);
    } else {
      setOutput((prev) => `${prev}\n\n>>> Executed at ${new Date().toLocaleTimeString()}\n${res.output}`);
    }
  };

  const handleClearOutput = () => {
    setOutput('');
    setError(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Framework Engine</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">Python & JavaScript Abstraction</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Interactive ORM & Database Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Execute direct Python Frappe ORM scripts and JavaScript database queries with live feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setLanguage('python')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === 'python' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Python ORM
            </button>
            <button
              onClick={() => setLanguage('javascript')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === 'javascript' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              JavaScript DBAL
            </button>
          </div>

          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute Code</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Recipes sidebar, Code editor, Terminal Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Presets Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Curated Script Recipes</span>
            </div>

            <div className="space-y-2">
              {PRESET_RECIPES.map((r) => {
                const isSelected = selectedRecipe.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRecipe(r)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {r.title}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {r.language}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      {r.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Syntax Reference Card */}
          <div className="bg-slate-900 rounded-xl p-4 text-white border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ORM Method Reference
            </h4>
            <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
              <div><strong className="text-emerald-400">frappe.get_doc</strong>(doctype, name)</div>
              <div><strong className="text-emerald-400">frappe.db.get_list</strong>(doctype, filters)</div>
              <div><strong className="text-emerald-400">frappe.db.get_value</strong>(doctype, filter, field)</div>
              <div><strong className="text-emerald-400">frappe.db.set_value</strong>(doctype, name, f, val)</div>
              <div><strong className="text-emerald-400">doc.insert</strong>() · <strong className="text-emerald-400">doc.submit</strong>()</div>
            </div>
          </div>
        </div>

        {/* Code Editor & Execution Output (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Editor Container */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 font-mono">
                script.{language === 'python' ? 'py' : 'js'}
              </span>
              <span className="text-slate-400 text-[11px]">
                Ctrl + Enter to Execute
              </span>
            </div>

            <textarea
              rows={12}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleRun();
                }
              }}
              spellCheck={false}
              className="w-full p-4 font-mono text-xs bg-slate-950 text-emerald-300 focus:outline-none leading-relaxed resize-y"
            />
          </div>

          {/* Terminal Output */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-md">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <TerminalIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Console Output</span>
              </div>
              <button
                onClick={handleClearOutput}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Output</span>
              </button>
            </div>

            <div className="p-4 max-h-[300px] overflow-auto">
              <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
