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
const docs: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Download,
    content: [
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        tags: ['setup', 'install', 'requirements', 'azure', 'node'],
        body: `
          <p>Before using Nestly you'll need:</p>
          <ul>
            <li><strong>Node.js 18+</strong> and npm installed</li>
            <li>A <strong>Microsoft account</strong> (personal or work/school)</li>
            <li>An <strong>Azure AD App Registration</strong> for OAuth — see the setup guide below</li>
            <li>(Optional) An <strong>Azure OpenAI resource</strong> for AI meal planning</li>
          </ul>
        `,
      },
      {
        id: 'azure-app-registration',
        title: 'Azure AD App Registration',
        tags: ['azure', 'oauth', 'client id', 'app registration', 'authentication', 'permissions', 'setup'],
        body: `
          <ol>
            <li>Go to <a href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps" target="_blank" rel="noopener">Azure Portal → App Registrations</a></li>
            <li>Click <strong>"New registration"</strong></li>
            <li>Set <strong>Name</strong> to "Nestly"</li>
            <li>Set <strong>Supported account types</strong> to "Accounts in any organizational directory and personal Microsoft accounts"</li>
            <li>Set <strong>Redirect URI</strong> → Platform: <em>Single-page application (SPA)</em>, URI: <code>http://localhost:5173/auth/callback</code></li>
            <li>After registration, copy the <strong>Application (client) ID</strong></li>
            <li>Go to <strong>API permissions</strong> and add these Microsoft Graph permissions:
              <ul>
                <li><code>User.Read</code> — Read user profile</li>
                <li><code>Calendars.ReadWrite</code> — Read &amp; write calendars</li>
                <li><code>Calendars.ReadWrite.Shared</code> — Access shared calendars</li>
                <li><code>Files.ReadWrite</code> — Read &amp; write OneDrive files (settings sync)</li>
                <li><code>Tasks.ReadWrite</code> — Read &amp; write tasks</li>
                <li><code>offline_access</code> — Maintain access to data</li>
              </ul>
            </li>
            <li>Click <strong>"Grant admin consent"</strong> if applicable</li>
          </ol>
        `,
      },
      {
        id: 'installation',
        title: 'Installation & Setup',
        tags: ['install', 'clone', 'npm', 'env', 'environment', 'setup', 'run'],
        body: `
          <ol>
            <li>Clone the repository:<br/><code>git clone https://github.com/sebastienlevert/nestly.git && cd nestly</code></li>
            <li>Install dependencies:<br/><code>npm install</code></li>
            <li>Create your environment file:<br/><code>cp .env.example .env</code></li>
            <li>Edit <code>.env</code> with your credentials:
              <pre>VITE_MICROSOFT_CLIENT_ID=your_client_id
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
VITE_AZURE_OPENAI_KEY=your_api_key
VITE_AZURE_OPENAI_DEPLOYMENT=your_deployment_name</pre>
            </li>
            <li>Start the development server:<br/><code>npm run dev</code></li>
            <li>Open <a href="http://localhost:5173" target="_blank" rel="noopener">http://localhost:5173</a></li>
          </ol>
        `,
      },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    icon: Zap,
    content: [
      {
        id: 'calendar',
        title: 'Shared Calendars',
        tags: ['calendar', 'outlook', 'events', 'agenda', 'week', 'month', 'day', 'sync', 'multi-account'],
        body: `
          <p>Nestly syncs with <strong>multiple Microsoft 365 accounts</strong> so every family member's schedule appears in one place.</p>
          <ul>
            <li><strong>Agenda view</strong> — your week at a glance in a beautiful card layout</li>
            <li><strong>Day / Week / Month</strong> — classic calendar views with drag-and-click event creation</li>
            <li><strong>Color-coded events</strong> — customize colors and emoji per calendar in Settings</li>
            <li><strong>Auto-sync</strong> — calendars refresh every 5 minutes automatically</li>
            <li><strong>Create events</strong> — click the <strong>+</strong> button on any day, choose the target calendar</li>
          </ul>
        `,
      },
      {
        id: 'weather',
        title: 'Weather Forecasts',
        tags: ['weather', 'forecast', 'temperature', 'rain', 'sun', 'open-meteo', 'location'],
        body: `
          <p>Each day in the Agenda view shows a <strong>weather emoji and high temperature</strong> right next to the + button.</p>
          <ul>
            <li>Powered by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a> — free, no API key required</li>
            <li><strong>16-day forecast</strong> in a single API call</li>
            <li>Cached for <strong>6 hours</strong> — at most ~4 API calls per day</li>
            <li>Hover the icon to see full description and high/low range</li>
            <li>Configure your city in <strong>Settings → Calendars → Weather Location</strong></li>
            <li>Falls back to browser geolocation if no city is set</li>
          </ul>
        `,
      },
      {
        id: 'tasks',
        title: 'Microsoft To Do',
        tags: ['tasks', 'todo', 'to do', 'lists', 'grocery', 'chores'],
        body: `
          <p>Your <strong>Microsoft To Do</strong> lists are integrated directly into Nestly.</p>
          <ul>
            <li>View all your task lists from connected accounts</li>
            <li>Create new tasks, toggle completion, set importance</li>
            <li>Add due dates to keep track of deadlines</li>
            <li>Choose which lists to display in <strong>Settings → To Dos</strong></li>
            <li>Changes sync back to Microsoft To Do automatically</li>
          </ul>
        `,
      },
      {
        id: 'meals',
        title: 'AI Meal Planning',
        tags: ['meals', 'recipes', 'ai', 'openai', 'fridge', 'cooking', 'grocery', 'ingredients'],
        body: `
          <p>Nestly uses <strong>Azure OpenAI</strong> to suggest recipes based on what's in your fridge.</p>
          <ul>
            <li><strong>Fridge inventory</strong> — add ingredients organized by category</li>
            <li><strong>AI suggestions</strong> — get recipe ideas from your available ingredients</li>
            <li><strong>Save favorites</strong> — bookmark recipes you love for later</li>
            <li><strong>Meal calendar</strong> — assign a calendar for meal events in Settings</li>
            <li>Requires an Azure OpenAI resource (GPT-4 or GPT-3.5-turbo)</li>
          </ul>
        `,
      },
      {
        id: 'photos',
        title: 'Photo Slideshow',
        tags: ['photos', 'slideshow', 'onedrive', 'images', 'gallery', 'ambient'],
        body: `
          <p>Turn your tablet into a <strong>digital photo frame</strong> using your OneDrive photos.</p>
          <ul>
            <li>Browse and select any OneDrive folder</li>
            <li>Automatic slideshow with smooth <strong>crossfade transitions</strong></li>
            <li>Touch controls — pause/play, next/previous</li>
            <li>Fullscreen mode for ambient display</li>
            <li>Supports JPG, PNG, GIF, and WebP formats</li>
          </ul>
        `,
      },
      {
        id: 'touch-design',
        title: 'Touch-First Design',
        tags: ['touch', 'tablet', 'surface', 'responsive', 'mobile', 'wake lock', 'always on'],
        body: `
          <p>Nestly is built specifically for a <strong>Surface tablet on your kitchen counter</strong>.</p>
          <ul>
            <li><strong>44×44px minimum touch targets</strong> — every button is easy to tap</li>
            <li><strong>Screen wake lock</strong> — keeps the display on (toggles off after 5 min idle)</li>
            <li><strong>Responsive layout</strong> — works on phones, tablets, and desktops</li>
            <li><strong>Mobile sidebar</strong> — slide-out navigation on smaller screens</li>
            <li><strong>Auto-reload</strong> — stays fresh without manual refreshes</li>
          </ul>
        `,
      },
    ],
  },
  {
    id: 'customization',
    title: 'Customization',
    icon: Palette,
    content: [
      {
        id: 'themes',
        title: 'Themes',
        tags: ['theme', 'dark mode', 'light mode', 'colors', 'appearance', 'customization'],
        body: `
          <p>Nestly ships with <strong>multiple built-in themes</strong> to match your style.</p>
          <ul>
            <li>Switch themes in <strong>Settings → General → Theme</strong></li>
            <li>Includes light, dark, and colorful options</li>
            <li>Themes apply instantly without page reload</li>
            <li>Calendar event colors can be customized per calendar</li>
          </ul>
        `,
      },
      {
        id: 'language',
        title: 'Language & Localization',
        tags: ['language', 'locale', 'french', 'english', 'i18n', 'translation', 'localization'],
        body: `
          <p>Nestly supports <strong>full internationalization</strong>.</p>
          <ul>
            <li>Currently available in <strong>English</strong> and <strong>French-Canadian</strong></li>
            <li>Change language in <strong>Settings → General → Language</strong></li>
            <li>All labels, dates, and messages are localized</li>
            <li>Easy to add more languages — just create a new locale file</li>
          </ul>
        `,
      },
      {
        id: 'calendar-settings',
        title: 'Calendar Settings',
        tags: ['settings', 'calendar', 'emoji', 'color', 'name', 'customize'],
        body: `
          <p>Fine-tune your calendar experience in <strong>Settings → Calendars</strong>.</p>
          <ul>
            <li><strong>Calendar name</strong> — set the title shown at the top of the header</li>
            <li><strong>Toggle calendars</strong> — show/hide individual calendars</li>
            <li><strong>Color coding</strong> — assign a color to each calendar</li>
            <li><strong>Emoji labels</strong> — add an emoji identifier to each calendar</li>
            <li><strong>Weather location</strong> — set your city for weather forecasts</li>
            <li><strong>Meal calendar</strong> — choose which calendar to use for meal events</li>
          </ul>
        `,
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Shield,
    content: [
      {
        id: 'client-side',
        title: 'Client-Side Architecture',
        tags: ['privacy', 'security', 'client side', 'no backend', 'data', 'local'],
        body: `
          <p>Nestly is <strong>100% client-side</strong> — there is no backend server.</p>
          <ul>
            <li>All data flows directly between <strong>your browser</strong> and <strong>Microsoft 365 APIs</strong></li>
            <li>Authentication uses <strong>MSAL (Microsoft Authentication Library)</strong> with OAuth 2.0 PKCE</li>
            <li>Tokens and settings are stored in <strong>browser localStorage</strong></li>
            <li>No telemetry, no analytics, no tracking</li>
            <li>You can audit every network request in your browser's DevTools</li>
          </ul>
        `,
      },
      {
        id: 'data-storage',
        title: 'Data Storage',
        tags: ['storage', 'localstorage', 'cache', 'offline', 'data'],
        body: `
          <p>Nestly uses <strong>localStorage</strong> for caching and settings — nothing leaves your device.</p>
          <ul>
            <li><strong>Calendar cache</strong> — events are cached for offline access</li>
            <li><strong>Weather cache</strong> — forecasts cached for 6 hours to minimize API calls</li>
            <li><strong>Settings</strong> — theme, locale, calendar preferences</li>
            <li><strong>Auth tokens</strong> — managed by MSAL, stored securely in browser storage</li>
            <li>Clear all data anytime by clearing your browser's localStorage</li>
          </ul>
        `,
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: AlertTriangle,
    content: [
      {
        id: 'auth-issues',
        title: 'Authentication Issues',
        tags: ['login', 'sign in', 'authentication', 'error', 'failed', 'client id', 'redirect'],
        body: `
          <ul>
            <li><strong>"Authentication initialization failed"</strong> — Check that your <code>VITE_MICROSOFT_CLIENT_ID</code> is correct in <code>.env</code></li>
            <li><strong>"Failed to sign in"</strong> — Ensure the redirect URI in Azure AD matches exactly: <code>http://localhost:5173/auth/callback</code></li>
            <li><strong>"Invalid scopes"</strong> — Verify all required API permissions are added and admin-consented in Azure portal</li>
            <li><strong>Popup blocked</strong> — Allow popups for localhost in your browser settings</li>
          </ul>
        `,
      },
      {
        id: 'api-errors',
        title: 'API Errors',
        tags: ['api', 'error', '401', '403', '429', 'unauthorized', 'forbidden', 'rate limit'],
        body: `
          <ul>
            <li><strong>401 Unauthorized</strong> — Token expired. Sign out and sign back in.</li>
            <li><strong>403 Forbidden</strong> — Check API permissions in your Azure AD app registration</li>
            <li><strong>429 Too Many Requests</strong> — Rate limited by Microsoft Graph. Wait a moment and try again.</li>
            <li><strong>Network errors</strong> — Check your internet connection. Nestly will use cached data when offline.</li>
          </ul>
        `,
      },
      {
        id: 'dev-issues',
        title: 'Development Issues',
        tags: ['development', 'port', 'build', 'error', 'module', 'npm', 'vite'],
        body: `
          <ul>
            <li><strong>Port 5173 in use</strong> — Kill existing processes or change port in <code>vite.config.ts</code></li>
            <li><strong>Module not found</strong> — Run <code>npm install</code> again</li>
            <li><strong>Build errors</strong> — Clear cache: <code>rm -rf node_modules && npm install</code></li>
            <li><strong>TypeScript errors</strong> — Run <code>npx tsc --noEmit</code> to check for type issues</li>
          </ul>
        `,
      },
    ],
  },
];

// ─── Search helper ──────────────────────────────────────────────────
function searchDocs(query: string): { section: DocSection; article: DocArticle; score: number }[] {
  if (!query.trim()) return [];
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const results: { section: DocSection; article: DocArticle; score: number }[] = [];

  for (const section of docs) {
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
  const [query, setQuery] = useState('');

  // Resolve initial article from URL params
  const resolvedSection = initialSection && docs.find(s => s.id === initialSection) ? initialSection : 'getting-started';
  const resolvedArticle = initialArticle && docs.find(s => s.id === resolvedSection)?.content.find(a => a.id === initialArticle)
    ? initialArticle
    : docs.find(s => s.id === resolvedSection)!.content[0].id;

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([resolvedSection]));
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => searchDocs(query), [query]);
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
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Documentation</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Everything you need to get started, configure, and troubleshoot Nestly.
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
          placeholder="Search docs… (Ctrl+K)"
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
                No results for "{query}"
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
