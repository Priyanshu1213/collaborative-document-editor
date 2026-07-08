'use client';

import { Button } from '@/components/ui/button';
import { FileText, LogOut, Moon, Search, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  const profileRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                DocVerse
              </h1>
              <p className="truncate text-xs text-muted-foreground">Welcome back, {userName}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden flex-1 justify-center px-4 md:flex">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={handleSearch}
                className="h-10 w-full rounded-xl border border-input bg-background/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileInfo((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white shadow-soft outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring/60"
                aria-label="Profile"
              >
                {userName.charAt(0).toUpperCase()}
              </button>

              {showProfileInfo && (
                <div className="animate-float-up absolute right-0 z-10 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-popover shadow-elevated">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient font-semibold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{userName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {userEmail || 'No email available'}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-border p-2">
                    <button
                      onClick={onLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={onLogout} className="hidden gap-2 sm:inline-flex">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={handleSearch}
              className="h-10 w-full rounded-xl border border-input bg-background/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
