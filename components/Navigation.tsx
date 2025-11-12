'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { useTheme } from '@/app/theme-provider';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasAccess } = useWhop();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation: Array<{ name: string; href: string; icon: string; premium?: boolean }> = [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    { name: 'Goals', href: '/goals', icon: '🎯' },
    // AI Assistant temporarily disabled
    // { name: 'AI Assistant', href: '/ai', icon: '🤖' },
    { name: 'News', href: '/news', icon: '📰' },
    { name: 'Products', href: '/products', icon: '💳' },
    { name: 'Invest', href: '/invest', icon: '📈' },
    { name: 'Stories', href: '/stories', icon: '⭐' },
  ];

  const isActive = (href: string) => pathname === href;

  const actionButtonClasses =
    'rounded-lg px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/40';

  const baseNavButtonClasses =
    'flex items-center space-x-2 rounded-full border px-4 py-2 text-sm font-medium transition-all';

  const handleNavigate = (href: string, premium = false) => {
    if (premium && !hasAccess) {
      router.push('/subscribe');
      return;
    }
    router.push(href);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex min-w-[140px] flex-shrink-0 items-center space-x-3"
        >
          <img src="/logo.png" alt="Networth" className="h-8 w-8" />
          <span className="hidden text-lg font-bold text-foreground sm:inline">Networth</span>
        </button>

        <div className="hidden flex-1 items-center justify-center space-x-1 md:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.href, item.premium)}
                className={`${baseNavButtonClasses} ${
                  active
                    ? 'border-accent/50 bg-surface text-foreground shadow-sm'
                    : 'border-transparent text-muted hover:border-border hover:bg-surface-muted hover:text-foreground'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                {item.premium && !hasAccess && (
                  <span className="ml-1 rounded bg-surface-muted px-1.5 py-0.5 text-xs text-muted">
                    Pro
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden items-center space-x-2 md:flex">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`${actionButtonClasses} border border-border bg-surface-muted text-foreground hover:bg-surface`}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          {!hasAccess && (
            <button
              onClick={() => router.push('/subscribe')}
              className={`${actionButtonClasses} bg-[var(--button-primary-bg)] text-[color:var(--button-primary-fg)] hover:opacity-90`}
            >
              Upgrade
            </button>
          )}
          <button
            onClick={() => router.push('/settings')}
            className={`${actionButtonClasses} ${
              pathname === '/settings'
                ? 'bg-surface text-foreground shadow'
                : 'border border-border bg-surface-muted text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            Settings
          </button>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-muted hover:bg-surface-muted md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-surface">
          <div className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">Appearance</span>
              <button
                onClick={toggleTheme}
                className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-muted hover:bg-surface"
              >
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>

            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.href, item.premium)}
                className={`${baseNavButtonClasses} w-full justify-between ${
                  isActive(item.href)
                    ? 'border-accent/50 bg-surface text-foreground shadow-sm'
                    : 'border-transparent text-muted hover:border-border hover:bg-surface-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.premium && !hasAccess && (
                  <span className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">Pro</span>
                )}
              </button>
            ))}

            <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
              {!hasAccess && (
                <button
                  onClick={() => {
                    router.push('/subscribe');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-lg bg-[var(--button-primary-bg)] px-4 py-3 text-sm font-semibold text-[color:var(--button-primary-fg)] transition-colors hover:opacity-90"
                >
                  Upgrade to Pro
                </button>
              )}
              <button
                onClick={() => {
                  router.push('/settings');
                  setMobileMenuOpen(false);
                }}
                className={`${baseNavButtonClasses} w-full justify-between text-sm font-semibold ${
                  pathname === '/settings'
                    ? 'border-accent/50 bg-surface text-foreground shadow-sm'
                    : 'border-transparent text-muted hover:border-border hover:bg-surface-muted hover:text-foreground'
                }`}
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
