import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Utensils,
  Image,
  Cloud,
  Shield,
  Zap,
  Star,
  Github,
  ArrowRight,
  Sparkles,
  MonitorSmartphone,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DocsSection } from '../components/common/DocsSection';

const REPO_URL = 'https://github.com/sebastienlevert/nestly';
const REPO_API = 'https://api.github.com/repos/sebastienlevert/nestly';

// ─── Animated counter ───────────────────────────────────────────────
function AnimatedNumber({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{value}</>;
}

// ─── Feature card ───────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div
      className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Why card ───────────────────────────────────────────────────────
function WhyCard({ emoji, title, description }: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <span className="text-3xl shrink-0">{emoji}</span>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Main Landing Page ──────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const { addAccount, isLoading } = useAuth();
  const [stars, setStars] = useState(0);

  useEffect(() => {
    fetch(REPO_API)
      .then((r) => r.json())
      .then((d) => { if (d.stargazers_count) setStars(d.stargazers_count); })
      .catch(() => {});
  }, []);

  const handleGetStarted = async () => {
    try {
      await addAccount();
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      {/* ── Inline keyframe styles ─────────────────────────────── */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / .3); }
          50%      { box-shadow: 0 0 24px 4px hsl(var(--primary) / .15); }
        }
        .animate-fade-in-up {
          animation: fade-in-up .7s ease-out both;
        }
        .animate-fade-in {
          animation: fade-in .8s ease-out both;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>

      {/* ── Nav bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              N
            </div>
            <span className="text-xl font-bold tracking-tight">Nestly</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#docs"
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen size={16} />
              Docs
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github size={18} />
              <Star size={14} className="text-yellow-500" />
              <span className="font-medium">{stars > 0 ? <AnimatedNumber target={stars} /> : '—'}</span>
            </a>
            <Button onClick={handleGetStarted} disabled={isLoading} size="sm">
              {isLoading ? 'Signing in…' : 'Get Started'}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <Sparkles size={14} />
              Free &amp; Open Source
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Your family's week,
            <br />
            <span className="text-primary">beautifully organized.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Nestly brings your Microsoft calendars, tasks, meals, and photos into one
            gorgeous dashboard — designed for the Surface tablet on your kitchen counter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="h-12 px-8 text-base rounded-xl animate-pulse-glow"
            >
              {isLoading ? 'Signing in…' : 'Start Using Nestly'}
              <ArrowRight size={18} className="ml-1" />
            </Button>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="h-12 px-8 text-base rounded-xl">
                <Github size={18} className="mr-1" />
                View on GitHub
              </Button>
            </a>
          </div>

          {/* Mini preview (emoji-based mockup) */}
          <div className="mt-16 mx-auto max-w-3xl animate-fade-in-up rounded-2xl border border-border bg-card/50 backdrop-blur shadow-2xl p-1" style={{ animationDelay: '500ms' }}>
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              {/* Fake top bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-muted-foreground font-medium">Nestly — Your Week</span>
              </div>
              {/* Fake agenda grid */}
              <div className="grid grid-cols-4 gap-2 p-4">
                {['Mon', 'Tue', 'Wed', 'Thu'].map((day, i) => (
                  <div key={day} className="rounded-lg border border-border bg-background p-3 animate-fade-in-up" style={{ animationDelay: `${600 + i * 100}ms` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-foreground">{day}</span>
                      <span className="text-sm">{['☀️', '⛅', '🌧️', '🌤️'][i]}</span>
                    </div>
                    <div className={`h-2 rounded-full mb-1.5 ${['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'][i]}`} style={{ width: `${60 + i * 10}%` }} />
                    <div className={`h-2 rounded-full ${['bg-blue-400/50', 'bg-green-400/50', 'bg-purple-400/50', 'bg-orange-400/50'][i]}`} style={{ width: `${40 + i * 8}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything your family needs
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A single dashboard that keeps everyone in sync — no more &ldquo;I didn&rsquo;t know about that.&rdquo;
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Calendar}
            title="Shared Calendars"
            description="Sync multiple Microsoft 365 calendars from different accounts. See everyone's schedule in one beautiful agenda view."
            delay={0}
          />
          <FeatureCard
            icon={Cloud}
            title="14-Day Weather"
            description="Weather forecasts right on your calendar — powered by Open-Meteo. Know what's coming without opening another app."
            delay={100}
          />
          <FeatureCard
            icon={CheckSquare}
            title="Microsoft To Do"
            description="Manage shared grocery lists, chores, and family tasks. All your Microsoft To Do lists, right here."
            delay={200}
          />
          <FeatureCard
            icon={Utensils}
            title="AI Meal Planning"
            description="Get meal suggestions powered by Azure OpenAI. Plan your week's meals and generate shopping lists effortlessly."
            delay={300}
          />
          <FeatureCard
            icon={Image}
            title="Photo Slideshow"
            description="Display family photos from OneDrive as a beautiful ambient slideshow. Your best memories, always visible."
            delay={400}
          />
          <FeatureCard
            icon={MonitorSmartphone}
            title="Touch-First Design"
            description="Optimized for Surface tablets with large touch targets, screen wake lock, and a responsive layout that works anywhere."
            delay={500}
          />
        </div>
      </section>

      {/* ── Why Nestly ─────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Why Nestly?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built for real families by a real parent who needed something better than another app to check.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <WhyCard
              emoji="🔒"
              title="100% Client-Side"
              description="Your data never touches a server. Everything runs in the browser with direct Microsoft 365 API calls. Your family's info stays yours."
            />
            <WhyCard
              emoji="⚡"
              title="Instant & Always-On"
              description="Designed for an always-on tablet on your kitchen counter. Screen wake lock keeps it visible, and auto-reload keeps it fresh."
            />
            <WhyCard
              emoji="🌍"
              title="Multi-Language"
              description="Built with full internationalization support. Currently available in English and French-Canadian, with more locales easy to add."
            />
            <WhyCard
              emoji="🎨"
              title="Beautiful Themes"
              description="Multiple carefully crafted themes to match your home's vibe. Dark mode, light mode, and everything in between."
            />
          </div>
        </div>
      </section>

      {/* ── Docs ───────────────────────────────────────────────── */}
      <section className="border-y border-border bg-background">
        <DocsSection />
      </section>

      {/* ── Open Source Banner ──────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="relative rounded-2xl border border-border bg-card p-10 text-center overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="inline-flex items-center gap-2 mb-4">
            <Github size={28} className="text-foreground" />
            <Shield size={22} className="text-green-500" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Free &amp; Open Source. Forever.
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Nestly is MIT-licensed and completely free. No subscriptions, no data collection,
            no lock-in. Star us on GitHub and help us grow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="h-11 px-6 rounded-xl">
                <Star size={16} className="mr-1 text-yellow-500" />
                Star on GitHub
                {stars > 0 && <span className="ml-1.5 text-xs bg-muted px-2 py-0.5 rounded-full font-medium"><AnimatedNumber target={stars} /></span>}
              </Button>
            </a>
            <Button onClick={handleGetStarted} disabled={isLoading} className="h-11 px-6 rounded-xl">
              <Zap size={16} className="mr-1" />
              {isLoading ? 'Signing in…' : 'Get Started — It\'s Free'}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">N</div>
            <span>Nestly — Built with ❤️ for families</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Github size={16} /> GitHub
            </a>
            <span>•</span>
            <span>Free &amp; Open Source</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
