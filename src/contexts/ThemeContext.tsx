import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { themes, defaultTheme, type ThemeName, type Theme } from '../config/themes';
import { StorageService } from '../services/storage.service';

/** Convert an HSL string like "217 91% 60%" to a hex color like "#3b82f6" */
function hslToHex(hsl: string): string {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return '#6366f1';
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    // Load theme from settings
    const settings = StorageService.getSettings();
    return settings.theme || defaultTheme;
  });

  const theme = themes[themeName];

  const setTheme = (newTheme: ThemeName) => {
    setThemeName(newTheme);
    const settings = StorageService.getSettings();
    StorageService.setSettings({ ...settings, theme: newTheme });
  };

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;

    // Apply shadcn/ui CSS variables (HSL format)
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--card', theme.colors.card);
    root.style.setProperty('--card-foreground', theme.colors.cardForeground);
    root.style.setProperty('--popover', theme.colors.popover);
    root.style.setProperty('--popover-foreground', theme.colors.popoverForeground);
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-foreground', theme.colors.accentForeground);
    root.style.setProperty('--destructive', theme.colors.destructive);
    root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground);
    root.style.setProperty('--border', theme.colors.border);
    root.style.setProperty('--input', theme.colors.input);
    root.style.setProperty('--ring', theme.colors.ring);
    root.style.setProperty('--radius', theme.colors.radius);

    // Set data attribute and class for theme-specific styling
    root.setAttribute('data-theme', themeName);

    // Add/remove dark class for dark mode themes
    const darkThemes: ThemeName[] = ['dark', 'nord', 'catppuccin', 'dracula', 'midnight'];
    if (darkThemes.includes(themeName)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Dynamically update PWA theme-color meta tag
    const primaryHex = hslToHex(theme.colors.primary);
    const bgHex = hslToHex(theme.colors.background);
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', primaryHex);
    }

    // Persist hex colors so the inline script in index.html can apply them
    // before React hydrates (avoids Android status bar flash)
    try {
      localStorage.setItem('nestly_theme_color', primaryHex);
      localStorage.setItem('nestly_theme_bg', bgHex);
    } catch { /* storage full or unavailable */ }

    // Dynamically update favicon to reflect theme primary color
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="${primaryHex}"/>
      <path d="M7 20 Q7 27 16 27 Q25 27 25 20" fill="none" stroke="${bgHex}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
      <path d="M8.5 22 Q16 25.5 23.5 22" fill="none" stroke="${bgHex}" stroke-width="1.5" stroke-linecap="round" opacity="0.35"/>
      <ellipse cx="12.5" cy="18.5" rx="3" ry="3.8" fill="${bgHex}" opacity="0.9" transform="rotate(-8 12.5 18.5)"/>
      <ellipse cx="16" cy="17.8" rx="3" ry="4" fill="${bgHex}" opacity="0.9"/>
      <ellipse cx="19.5" cy="18.5" rx="3" ry="3.8" fill="${bgHex}" opacity="0.9" transform="rotate(8 19.5 18.5)"/>
      <path d="M16 10 C16 10 14.5 7.5 13 7.5 C11.2 7.5 10 9 10 10.2 C10 13 16 15 16 15 C16 15 22 13 22 10.2 C22 9 20.8 7.5 19 7.5 C17.5 7.5 16 10 16 10Z" fill="#f9a8d4" opacity="0.9"/>
    </svg>`;
    const faviconDataUrl = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;
    let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (faviconLink) {
      faviconLink.href = faviconDataUrl;
    }

    // Update apple-touch-icon dynamically via a canvas-rendered PNG
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw rounded rectangle background
        const r = 36;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(180 - r, 0);
        ctx.quadraticCurveTo(180, 0, 180, r);
        ctx.lineTo(180, 180 - r);
        ctx.quadraticCurveTo(180, 180, 180 - r, 180);
        ctx.lineTo(r, 180);
        ctx.quadraticCurveTo(0, 180, 0, 180 - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fillStyle = primaryHex;
        ctx.fill();

        // Draw a simple "N" letter for Nestly
        ctx.fillStyle = bgHex;
        ctx.globalAlpha = 0.9;
        ctx.font = 'bold 100px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', 90, 95);
        ctx.globalAlpha = 1;

        const pngUrl = canvas.toDataURL('image/png');
        let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
        if (appleIcon) {
          appleIcon.href = pngUrl;
        }
      }
    } catch { /* canvas not supported — static icon used */ }
  }, [theme, themeName]);

  const value: ThemeContextType = {
    theme,
    themeName,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
