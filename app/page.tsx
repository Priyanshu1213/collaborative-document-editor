'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Moon, Users, Zap, Sun } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      router.replace('/dashboard');
    }
  }, [router]);

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
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <nav className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">House of EdTech</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl text-center">
          <h2 className="mb-6 text-5xl font-bold tracking-tight text-foreground">
            Collaborate, Create, and Innovate
          </h2>
          <p className="mb-12 text-xl text-muted-foreground">
            A powerful collaborative document editor with real-time editing, offline support, version history, and AI-powered features to enhance your writing.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Start Creating Now <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid w-full max-w-4xl gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border p-6">
            <FileText className="h-10 w-10 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Rich Editing</h3>
            <p className="text-center text-muted-foreground">
              Full-featured text editor with markdown support and formatting options
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-lg border border-border p-6">
            <Users className="h-10 w-10 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Real-time Collaboration</h3>
            <p className="text-center text-muted-foreground">
              Work together with live cursors, typing indicators, and instant sync
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-lg border border-border p-6">
            <Zap className="h-10 w-10 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">AI Features</h3>
            <p className="text-center text-muted-foreground">
              Summarize, rewrite, check grammar, and get instant suggestions
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; 2025 House of EdTech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
