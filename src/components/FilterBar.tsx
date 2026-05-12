import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FilterBarProps {
  search: string;
  setSearch: (s: string) => void;
  selectedTag: string | null;
  setSelectedTag: (t: string | null) => void;
  allTags: string[];
}

export function FilterBar({ search, setSearch, selectedTag, setSelectedTag, allTags }: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12">
      <div className="relative w-full md:w-[400px] group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-prism-400 group-focus-within:text-accent-blue transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search milestones, memories, tags..."
          className="w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border border-prism-100 rounded-3xl focus:ring-4 focus:ring-accent-blue/10 focus:border-accent-blue outline-none transition-all shadow-sm font-medium placeholder:text-prism-300"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-prism-300 hover:text-prism-900 transition-colors p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 w-full md:w-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-2 text-prism-400 px-2 shrink-0">
          <Filter size={18} className="text-accent-purple" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filter</span>
        </div>
        
        <button 
          onClick={() => setSelectedTag(null)}
          className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm
            ${!selectedTag 
              ? 'bg-prism-900 text-white' 
              : 'bg-white border border-prism-100 text-prism-500 hover:border-prism-200'}
          `}
        >
          All Lifelines
        </button>

        {allTags.map(tag => (
          <button 
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm
              ${selectedTag === tag 
                ? 'prism-gradient text-white !border-transparent' 
                : 'bg-white border border-prism-100 text-prism-500 hover:border-prism-200'}
            `}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}
