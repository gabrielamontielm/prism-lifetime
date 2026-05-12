import React, { useState, useEffect } from 'react';
import { Search, Loader2, UserPlus, X } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { UserProfile } from '../../types';

interface UserSearchProps {
  onSelect: (user: UserProfile) => void;
  selectedUids: string[];
}

export function UserSearch({ onSelect, selectedUids }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const q = query(
          collection(db, 'users'),
          where('email', '>=', searchTerm),
          where('email', '<=', searchTerm + '\uf8ff'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => doc.data() as UserProfile);
        setResults(users.filter(u => !selectedUids.includes(u.uid)));
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedUids]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-prism-400" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by email..."
          className="w-full pl-11 pr-4 py-3 bg-prism-50 rounded-xl outline-none focus:ring-2 focus:ring-accent-blue transition-all"
        />
        {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-accent-blue" size={18} /></div>}
      </div>
      <div className="space-y-2">
        {results.map(user => (
          <div key={user.uid} className="flex items-center justify-between p-3 rounded-xl hover:bg-prism-50 transition-colors border border-transparent hover:border-prism-100">
            <div className="flex items-center gap-3">
              {user.photoURL ? <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold">{user.displayName?.[0] || user.email[0].toUpperCase()}</div>}
              <div>
                <p className="text-sm font-bold text-prism-900">{user.displayName || 'No Name'}</p>
                <p className="text-xs text-prism-400">{user.email}</p>
              </div>
            </div>
            <button onClick={() => onSelect(user)} className="p-2 text-accent-blue hover:bg-accent-blue/10 rounded-full transition-colors"><UserPlus size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
