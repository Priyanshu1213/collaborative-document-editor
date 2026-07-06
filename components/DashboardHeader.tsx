'use client';

import { Button } from '@/components/ui/button';
import { LogOut, Moon, Search, Sun, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DashboardHeaderProps {
  userName: string;
  userEmail?: string;
  onLogout: () => void;
  onSearch: (query: string) => void;
}

export default function DashboardHeader({ userName, userEmail, onLogout, onSearch }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    setTheme(initialTheme);
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(initialTheme);
    root.style.colorScheme = initialTheme;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.style.colorScheme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">House of EdTech</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {userName}</p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="gap-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileInfo((prev) => !prev)}
                className="gap-2"
              >
                <User className="h-5 w-5" />
              </Button>

              {showProfileInfo && (
                <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-border bg-background p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{userName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {userEmail || 'No email available'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
