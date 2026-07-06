'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  FileText,
  Moon,
  Users,
  Zap,
  Sun,
  Sparkles,
  History,
  WifiOff,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Rich Editing',
    description: 'A full-featured editor with markdown, formatting, and a distraction-free canvas.',
  },
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description: 'Work together with live cursors, typing indicators, and instant sync across devices.',
  },
  {
    icon: Sparkles,
    title: 'AI Features',
    description: 'Summarize, rewrite, and check grammar with intelligent suggestions built in.',
  },
  {
    icon: History,
    title: 'Version History',
    description: 'Every change is tracked. Roll back to any point with a complete revision timeline.',
  },
  {
    icon: WifiOff,
    title: 'Offline Support',
    description: 'Keep writing without a connection. Changes sync automatically once you are back.',
  },
  {
    icon: Zap,
    title: 'Blazing Fast',
    description: 'Instant load times and a responsive interface that never gets in your way.',
  },
];

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
    <div className="relative flex min-h-screen flex-col bg-aurora">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <FileText className="h-4.5 w-4.5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              House of EdTech
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative flex flex-1 flex-col items-center px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-128 bg-grid" aria-hidden />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center pt-24 pb-16 text-center">
          <div className="animate-float-up mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-sm text-muted-foreground shadow-soft backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Now with AI-powered writing assistance
          </div>

          <h1 className="animate-float-up text-balance text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Collaborate, Create,
            <br />
            and <span className="text-gradient">Innovate</span>
          </h1>

          <p className="animate-float-up mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
            A powerful collaborative document editor with real-time editing, offline support,
            version history, and AI-powered features to elevate your writing.
          </p>

          <div className="animate-float-up mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-6 shadow-glow">
                Start Creating Now <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-6">
                Sign In
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Free to get started · No credit card required
          </p>
        </div>

        {/* Features Grid */}
        <div className="relative mx-auto grid w-full max-w-5xl gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-6 shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-colors group-hover:bg-primary/15">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-gradient text-white">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <span>House of EdTech</span>
          </div>
          <p>&copy; 2025 House of EdTech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
