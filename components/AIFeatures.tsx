'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Wand2,
  X,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AIFeaturesProps {
  selectedText: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
}

type AIFeature = 'summarize' | 'rewrite' | 'grammar' | 'explain';

export default function AIFeatures({
  selectedText,
  isOpen,
  onClose,
  onApply,
}: AIFeaturesProps) {
  const [activeFeature, setActiveFeature] = useState<AIFeature | null>(null);
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !selectedText) return null;

  const callAI = async (feature: AIFeature) => {
    setIsLoading(true);
    setActiveFeature(feature);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      switch (feature) {
        case 'summarize':
          endpoint = '/api/ai/summarize';
          break;
        case 'rewrite':
          endpoint = '/api/ai/rewrite';
          break;
        case 'grammar':
          endpoint = '/api/ai/grammar-fix';
          break;
        case 'explain':
          endpoint = '/api/ai/explain';
          break;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: selectedText }),
        }
      );

      if (!response.ok) throw new Error('AI request failed');

      const data = await response.json();
      const resultKey =
        feature === 'summarize'
          ? 'summary'
          : feature === 'rewrite'
            ? 'rewritten'
            : feature === 'grammar'
              ? 'fixed'
              : 'explanation';

      setResult(data[resultKey]);
    } catch (error) {
      toast.error('AI feature failed. Please try again.');
      setActiveFeature(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApply(result);
    onClose();
    toast.success('Text applied');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-96 rounded-lg bg-background p-6 shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">AI Writing Assistant</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Features */}
        {!activeFeature || (activeFeature && !isLoading && !result) ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => callAI('summarize')}
              disabled={isLoading}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Wand2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Summarize</span>
              <span className="text-xs text-muted-foreground">
                Get a concise summary
              </span>
            </button>

            <button
              onClick={() => callAI('rewrite')}
              disabled={isLoading}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Rewrite</span>
              <span className="text-xs text-muted-foreground">
                Change tone or style
              </span>
            </button>

            <button
              onClick={() => callAI('grammar')}
              disabled={isLoading}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 hover:bg-muted transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Fix Grammar</span>
              <span className="text-xs text-muted-foreground">
                Improve spelling & punctuation
              </span>
            </button>

            <button
              onClick={() => callAI('explain')}
              disabled={isLoading}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 hover:bg-muted transition-colors disabled:opacity-50"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Explain</span>
              <span className="text-xs text-muted-foreground">
                Simplify complex text
              </span>
            </button>
          </div>
        ) : null}

        {/* Results */}
        {activeFeature && isLoading && (
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Processing your request...</p>
          </div>
        )}

        {activeFeature && !isLoading && result && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-foreground whitespace-pre-wrap">{result}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy} className="flex-1 gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>

              <Button onClick={handleApply} className="flex-1 gap-2">
                <ArrowRight className="h-4 w-4" />
                Apply
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setResult('');
                  setActiveFeature(null);
                }}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}
