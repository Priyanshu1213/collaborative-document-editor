'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  X,
  Copy,
  Check,
  CornerDownLeft,
  RotateCcw,
  Wand2,
  BookOpen,
  ScrollText,
  SpellCheck,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
  onInsert: (text: string) => void;
}

type Mode = 'generate' | 'transform';
type TransformAction = 'summarize' | 'rewrite' | 'grammar' | 'explain';

const TONES = ['Professional', 'Casual', 'Formal', 'Creative', 'Simple'] as const;

const PRESETS: { label: string; prompt: string }[] = [
  { label: 'Blog intro', prompt: 'Write an engaging introduction for a blog post about ' },
  { label: 'Outline', prompt: 'Create a detailed outline for an article about ' },
  { label: 'Email', prompt: 'Write a polished email to ' },
  { label: 'Key points', prompt: 'List the key points about ' },
  { label: 'Continue writing', prompt: 'Continue writing naturally from this text: ' },
];

const TRANSFORMS: {
  key: TransformAction;
  label: string;
  hint: string;
  icon: typeof Wand2;
  endpoint: string;
  resultKey: string;
}[] = [
  { key: 'summarize', label: 'Summarize', hint: 'Condense to the essentials', icon: ScrollText, endpoint: '/api/ai/summarize', resultKey: 'summary' },
  { key: 'rewrite', label: 'Rewrite', hint: 'Improve tone & flow', icon: Wand2, endpoint: '/api/ai/rewrite', resultKey: 'rewritten' },
  { key: 'grammar', label: 'Fix Grammar', hint: 'Spelling & punctuation', icon: SpellCheck, endpoint: '/api/ai/grammar-fix', resultKey: 'fixed' },
  { key: 'explain', label: 'Explain', hint: 'Simplify complex text', icon: BookOpen, endpoint: '/api/ai/explain', resultKey: 'explanation' },
];

export default function AIAssistant({ isOpen, onClose, selectedText = '', onInsert }: AIAssistantProps) {
  const [mode, setMode] = useState<Mode>('generate');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<(typeof TONES)[number]>('Professional');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastRun, setLastRun] = useState<null | (() => void)>(null);

  const hasSelection = selectedText.trim().length > 0;

  useEffect(() => {
    if (isOpen) {
      setMode(hasSelection ? 'transform' : 'generate');
      setResult('');
      setCopied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const request = async (endpoint: string, body: Record<string, unknown>, resultKey: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'AI request failed');
      }
      const data = await response.json();
      setResult(data[resultKey] ?? '');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const runGenerate = () => {
    if (prompt.trim().length < 3) {
      toast.error('Please describe what you want to generate');
      return;
    }
    const fn = () => request('/api/ai/generate', { prompt, tone: tone.toLowerCase() }, 'content');
    setLastRun(() => fn);
    fn();
  };

  const runTransform = (t: (typeof TRANSFORMS)[number]) => {
    if (!hasSelection) return;
    const body: Record<string, unknown> = { content: selectedText };
    if (t.key === 'rewrite') body.tone = tone.toLowerCase();
    const fn = () => request(t.endpoint, body, t.resultKey);
    setLastRun(() => fn);
    fn();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    onInsert(result);
    toast.success(hasSelection && mode === 'transform' ? 'Text replaced' : 'Content inserted');
    onClose();
  };

  const TabButton = ({ value, label, disabled }: { value: Mode; label: string; disabled?: boolean }) => (
    <button
      onClick={() => !disabled && (setMode(value), setResult(''))}
      disabled={disabled}
      className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        mode === value ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 pt-[8vh] backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="animate-float-up w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-popover shadow-elevated"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">
                {mode === 'generate' ? 'Generate new content from a prompt' : 'Transform your selected text'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 border-b border-border px-5 py-3">
          <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1">
            <TabButton value="generate" label="Generate" />
            <TabButton value="transform" label="Transform selection" disabled={!hasSelection} />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {/* GENERATE MODE */}
          {mode === 'generate' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setPrompt(p.prompt)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  What should I write?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runGenerate();
                  }}
                  rows={3}
                  autoFocus
                  placeholder="e.g. Write a friendly announcement about our new collaborative editor…"
                  className="w-full resize-none rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Tone</span>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
                    className="rounded-lg border border-input bg-background/60 px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={runGenerate} disabled={isLoading} className="gap-2 shadow-glow">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isLoading ? 'Generating…' : 'Generate'}
                </Button>
              </div>
            </div>
          )}

          {/* TRANSFORM MODE */}
          {mode === 'transform' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Selected text
                </p>
                <p className="line-clamp-3 text-sm text-foreground">{selectedText}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TRANSFORMS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => runTransform(t)}
                    disabled={isLoading}
                    className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft disabled:opacity-50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                      <t.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LOADING */}
          {isLoading && !result && (
            <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Thinking…</p>
            </div>
          )}

          {/* RESULT */}
          {result && !isLoading && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Result
              </div>
              <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                {result}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleInsert} className="gap-2 shadow-glow">
                  <CornerDownLeft className="h-4 w-4" />
                  {hasSelection && mode === 'transform' ? 'Replace' : 'Insert'}
                </Button>
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                {lastRun && (
                  <Button variant="ghost" onClick={() => lastRun()} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Regenerate
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
