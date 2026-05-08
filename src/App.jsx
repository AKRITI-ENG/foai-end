import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Moon, Sun, Sparkles } from 'lucide-react';
import ISSTracker from './components/ISSTracker';
import NewsDashboard from './components/NewsDashboard';
import AIChatbot from './components/AIChatbot';
import Charts from './components/Charts';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark'); // Default to dark for a premium feel
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors duration-500 font-sans selection:bg-purple-500/30">
      {/* Premium Background Gradients */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 dark:bg-purple-600/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 tracking-tight hidden sm:block">
              Orbit & Insight
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 backdrop-blur-sm hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-all hover:scale-105 active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 lg:p-8 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Top/Main Section: ISS Tracker spans full width on smaller screens, 2/3 on large */}
          <div className="xl:col-span-2 space-y-6 lg:space-y-8">
            <ISSTracker />
            <Charts onCategorySelect={setSelectedCategory} selectedCategory={selectedCategory} />
          </div>

          {/* Right Section: News Dashboard */}
          <div className="xl:col-span-1 space-y-6 xl:h-[calc(100vh-8rem)] xl:sticky xl:top-24">
             <NewsDashboard selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
          </div>
        </div>
      </main>

      <AIChatbot />
      <Toaster 
        position="bottom-left" 
        toastOptions={{
          className: 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] shadow-xl rounded-xl',
          style: { backdropFilter: 'blur(10px)' }
        }} 
      />
    </div>
  );
}

export default App;
