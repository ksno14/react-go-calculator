import React from 'react';
import { Calculator } from './components/Calculator';
import { Layers, Terminal, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="max-w-xl mx-auto w-full text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-3 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>React (TypeScript) + Go REST Microservice</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          Full-Stack Cloud Calculator
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          High-precision arithmetic microservice built with Go 1.22+ and React 18 with keyboard support and interactive calculation history.
        </p>
      </header>

      {/* Main calculator container */}
      <main className="flex-1 flex items-center justify-center w-full">
        <Calculator />
      </main>

      {/* Footer features */}
      <footer className="max-w-xl mx-auto w-full mt-8 pt-6 border-t border-slate-900 text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Go Clean Architecture • REST API</span>
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Multi-Stage Docker & Compose Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
