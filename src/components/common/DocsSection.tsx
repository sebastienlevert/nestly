import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Download,
  AlertTriangle,
  Palette,
  Shield,
  Zap,
  X,
} from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import type { TranslationKeys } from '../../locales/en';

// ─── Doc content model ──────────────────────────────────────────────
interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: DocArticle[];
}

interface DocArticle {
  id: string;
  title: string;
  body: string; // simple HTML subset
  tags: string[];
}

// ─── All documentation ──────────────────────────────────────────────
function getDocs(t: TranslationKeys): DocSection[] {
  return [
    {
      id: 'getting-started',
      title: t.docs?.sectionGettingStarted || 'Getting Started',
      icon: Download,
      content: [
        {
          id: 'prerequisites',
          title: t.docs?.prerequisites || 'Prerequisites',
          tags: ['setup', 'install', 'requirements', 'azure', 'node'],
          body: t.docs?.prerequisitesBody || '',
        },
        {
          id: 'azure-app-registration',
          title: t.docs?.azureAppRegistration || 'Azure AD App Registration',
          tags: ['azure', 'oauth', 'client id', 'app registration', 'authentication', 'permissions', 'setup'],
          body: t.docs?.azureAppRegistrationBody || '',
        },
        {
          id: 'installation',
          title: t.docs?.installation || 'Installation & Setup',
          tags: ['install', 'clone', 'npm', 'env', 'environment', 'setup', 'run'],
          body: t.docs?.installationBody || '',
        },
      ],
    },
    {
      id: 'features',
      title: t.docs?.sectionFeatures || 'Features',
      icon: Zap,
      content: [
        {
          id: 'calendar',
          title: t.docs?.sharedCalendars || 'Shared Calendars',
          tags: ['calendar', 'outlook', 'events', 'agenda', 'week', 'month', 'day', 'sync', 'multi-account'],
          body: t.docs?.sharedCalendarsBody || '',
        },
        {
          id: 'weather',
          title: t.docs?.weatherForecasts || 'Weather Forecasts',
          tags: ['weather', 'forecast', 'temperature', 'rain', 'sun', 'open-meteo', 'location'],
          body: t.docs?.weatherForecastsBody || '',
        },
        {
          id: 'tasks',
          title: t.docs?.microsoftToDo || 'Microsoft To Do',
          tags: ['tasks', 'todo', 'to do', 'lists', 'grocery', 'chores'],
          body: t.docs?.microsoftToDoBody || '',
        },
        {
          id: 'meals',
          title: t.docs?.aiMealPlanning || 'AI Meal Planning',
          tags: ['meals', 'recipes', 'ai', 'openai', 'fridge', 'cooking', 'grocery', 'ingredients'],
          body: t.docs?.aiMealPlanningBody || '',
        },
        {
          id: 'photos',
          title: t.docs?.photoSlideshow || 'Photo Slideshow',
          tags: ['photos', 'slideshow', 'onedrive', 'images', 'gallery', 'ambient'],
          body: t.docs?.photoSlideshowBody || '',
        },
        {
          id: 'touch-design',
          title: t.docs?.touchDesign || 'Touch-First Design',
          tags: ['touch', 'tablet', 'surface', 'responsive', 'mobile', 'wake lock', 'always on'],
          body: t.docs?.touchDesignBody || '',
        },
      ],
    },
    {
      id: 'customization',
      title: t.docs?.sectionCustomization || 'Customization',
      icon: Palette,
      content: [
        {
          id: 'themes',
          title: t.docs?.themes || 'Themes',
          tags: ['theme', 'dark mode', 'light mode', 'colors', 'appearance', 'customization'],
          body: t.docs?.themesBody || '',
        },
        {
          id: 'language',
          title: t.docs?.languageLocalization || 'Language & Localization',
          tags: ['language', 'locale', 'french', 'english', 'i18n', 'translation', 'localization'],
          body: t.docs?.languageLocalizationBody || '',
        },
        {
          id: 'calendar-settings',
          title: t.docs?.calendarSettings || 'Calendar Settings',
          tags: ['settings', 'calendar', 'emoji', 'color', 'name', 'customize'],
          body: t.docs?.calendarSettingsBody || '',
        },
      ],
    },
    {
      id: 'privacy',
      title: t.docs?.sectionPrivacy || 'Privacy & Security',
      icon: Shield,
      content: [
        {
          id: 'client-side',
          title: t.docs?.clientSide || 'Client-Side Architecture',
          tags: ['privacy', 'security', 'client side', 'no backend', 'data', 'local'],
          body: t.docs?.clientSideBody || '',
        },
        {
          id: 'data-storage',
          title: t.docs?.dataStorage || 'Data Storage',
          tags: ['storage', 'localstorage', 'cache', 'offline', 'data'],
          body: t.docs?.dataStorageBody || '',
        },
      ],
    },
    {
      id: 'troubleshooting',
      title: t.docs?.sectionTroubleshooting || 'Troubleshooting',
      icon: AlertTriangle,
      content: [
        {
          id: 'auth-issues',
          title: t.docs?.authIssues || 'Authentication Issues',
          tags: ['login', 'sign in', 'authentication', 'error', 'failed', 'client id', 'redirect'],
          body: t.docs?.authIssuesBody || '',
        },
        {
          id: 'api-errors',
          title: t.docs?.apiErrors || 'API Errors',
          tags: ['api', 'error', '401', '403', '429', 'unauthorized', 'forbidden', 'rate limit'],
          body: t.docs?.apiErrorsBody || '',
        },
        {
          id: 'dev-issues',
          title: t.docs?.devIssues || 'Development Issues',
          tags: ['development', 'port', 'build', 'error', 'module', 'npm', 'vite'],
          body: t.docs?.devIssuesBody || '',
        },
      ],
    },
  ];
}

// ─── Search helper ──────────────────────────────────────────────────
function searchDocs(allDocs: DocSection[], query: string): { section: DocSection; article: DocArticle; score: number }[] {
  if (!query.trim()) return [];
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const results: { section: DocSection; article: DocArticle; score: number }[] = [];

  for (const section of allDocs) {
    for (const article of section.content) {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const bodyLower = article.body.toLowerCase();
      const tagStr = article.tags.join(' ');

      for (const term of terms) {
        if (titleLower.includes(term)) score += 10;
        if (tagStr.includes(term)) score += 5;
        if (bodyLower.includes(term)) score += 2;
      }

      if (score > 0) results.push({ section, article, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ─── Highlight matches ──────────────────────────────────────────────
function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const terms = query.split(/\s+/).filter(Boolean);
  let result = text;
  for (const term of terms) {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    result = result.replace(regex, '<mark class="bg-primary/20 text-primary rounded px-0.5">$1</mark>');
  }
  return result;
}

// ─── Components ─────────────────────────────────────────────────────

function ArticleContent({ body, query }: { body: string; query: string }) {
  const highlighted = query ? highlightText(body, query) : body;
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-2
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-2
        [&_li]:text-sm [&_li]:text-muted-foreground [&_li]:leading-relaxed
        [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3
        [&_strong]:text-foreground [&_strong]:font-semibold
        [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-foreground
        [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:font-mono [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre]:text-foreground
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

// ─── Main DocsSection component ─────────────────────────────────────
interface DocsSectionProps {
  initialSection?: string;
  initialArticle?: string;
}

export const DocsSection: React.FC<DocsSectionProps> = ({ initialSection, initialArticle }) => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [query, setQuery] = useState('');

  const docs = useMemo(() => getDocs(t), [t]);

  // Resolve initial article from URL params
  const resolvedSection = initialSection && docs.find(s => s.id === initialSection) ? initialSection : 'getting-started';
  const resolvedArticle = initialArticle && docs.find(s => s.id === resolvedSection)?.content.find(a => a.id === initialArticle)
    ? initialArticle
    : docs.find(s => s.id === resolvedSection)!.content[0].id;

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([resolvedSection]));
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => searchDocs(docs, query), [docs, query]);
  const isSearching = query.trim().length > 0;

  // Expand the active section when URL changes
  useEffect(() => {
    setExpandedSections(prev => new Set(prev).add(resolvedSection));
  }, [resolvedSection]);

  // Keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectArticle = (sectionId: string, articleId: string) => {
    navigate(`/docs/${sectionId}/${articleId}`);
    setExpandedSections((prev) => new Set(prev).add(sectionId));
    setQuery('');
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find current article for the main pane
  const currentArticle = useMemo(() => {
    for (const section of docs) {
      const article = section.content.find((a) => a.id === resolvedArticle);
      if (article) return { section, article };
    }
    return { section: docs[0], article: docs[0].content[0] };
  }, [resolvedArticle]);

  return (
    <section id="docs" className="max-w-6xl mx-auto px-6 py-20">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <BookOpen size={28} className="text-primary" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{t.docs?.title || 'Documentation'}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {t.docs?.subtitle || 'Everything you need to get started, configure, and troubleshoot Nestly.'}
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-xl mx-auto mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.docs?.searchPlaceholder || 'Search docs… (Ctrl+K)'}
          className="w-full h-12 pl-11 pr-10 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}

        {/* Search results dropdown */}
        {isSearching && (
          <div className="absolute z-50 top-full mt-2 w-full rounded-xl border border-border bg-card shadow-xl max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map(({ section, article }) => (
                <button
                  key={article.id}
                  onClick={() => selectArticle(section.id, article.id)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 flex items-start gap-3"
                >
                  <section.icon size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <div
                      className="text-sm font-medium text-foreground"
                      dangerouslySetInnerHTML={{ __html: highlightText(article.title, query) }}
                    />
                    <div className="text-xs text-muted-foreground">{section.title}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                {t.docs?.noResults || 'No results for'} "{query}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Docs layout: sidebar + content */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden flex flex-col lg:flex-row min-h-[500px]">
        {/* Sidebar nav */}
        <nav className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/20 overflow-y-auto max-h-60 lg:max-h-none">
          <div className="p-3">
            {docs.map((section) => (
              <div key={section.id} className="mb-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <section.icon size={16} className="text-primary shrink-0" />
                  <span className="flex-1 text-left">{section.title}</span>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={14} className="text-muted-foreground" />
                  )}
                </button>
                {expandedSections.has(section.id) && (
                  <div className="ml-4 pl-3 border-l border-border">
                    {section.content.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => selectArticle(section.id, article.id)}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                          resolvedArticle === article.id
                            ? 'text-primary font-medium bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        }`}
                      >
                        {article.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Content pane */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <currentArticle.section.icon size={14} />
            <span>{currentArticle.section.title}</span>
            <ChevronRight size={12} />
            <span className="text-foreground font-medium">{currentArticle.article.title}</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-6">{currentArticle.article.title}</h3>
          <ArticleContent body={currentArticle.article.body} query="" />
        </div>
      </div>
    </section>
  );
};
