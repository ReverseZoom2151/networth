'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';

interface SettingsItem {
  label: string;
  description: string;
  icon: string;
  action?: () => void;
  disabled?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { userId, loading: whopLoading, hasAccess } = useWhop();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!whopLoading) {
      setLoading(false);
    }
  }, [whopLoading]);

  if (loading) {
    return <LoadingScreen message="Loading settings..." />;
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background transition-colors">
        <Navigation />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted">Manage your account and preferences</p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => router.push('/login')}
                className="rounded-lg bg-[var(--button-primary-bg)] px-6 py-3 font-semibold text-[color:var(--button-primary-fg)] transition-opacity hover:opacity-90"
              >
                Sign In
              </button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const settingsSections = [
    {
      title: 'Account',
      icon: '👤',
      items: [
        {
          label: 'Manage Goal',
          description: 'Update your financial goal and targets',
          action: () => router.push('/onboarding'),
          icon: '🎯',
        },
        {
          label: 'Subscription',
          description: hasAccess ? 'Manage your premium subscription' : 'Upgrade to premium',
          action: () => router.push('/subscribe'),
          icon: '⭐',
        },
      ] as SettingsItem[],
    },
    {
      title: 'Preferences',
      icon: '⚙️',
      items: [
        {
          label: 'Region & Location',
          description: 'Set your location for personalized advice',
          action: () => router.push('/settings/region'),
          icon: '🌍',
        },
        {
          label: 'Currency',
          description: 'Change your preferred currency',
          action: () => router.push('/settings/currency'),
          icon: '💱',
        },
        {
          label: 'Notifications',
          description: 'Coming soon - Manage email and push notifications',
          disabled: true,
          icon: '🔔',
        },
      ] as SettingsItem[],
    },
    {
      title: 'Data & Privacy',
      icon: '🔒',
      items: [
        {
          label: 'Export Data',
          description: 'Coming soon - Download your financial data',
          disabled: true,
          icon: '📥',
        },
        {
          label: 'Privacy Settings',
          description: 'Coming soon - Manage your privacy preferences',
          disabled: true,
          icon: '🔐',
        },
      ] as SettingsItem[],
    },
    {
      title: 'Support',
      icon: '💬',
      items: [
        {
          label: 'Help Center',
          description: 'Get help and learn how to use Networth',
          action: () => window.open('https://docs.networth.com', '_blank'),
          icon: '❓',
        },
        {
          label: 'Contact Support',
          description: 'Get in touch with our team',
          action: () => window.open('mailto:support@networth.com', '_blank'),
          icon: '✉️',
        },
      ] as SettingsItem[],
    },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Navigation />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted">Customize your account and preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <Card key={section.title} className="border border-border/60 bg-surface">
              <div className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{section.icon}</span>
                  <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                </div>

                <div className="space-y-3">
                  {section.items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={item.action || (() => {})}
                      disabled={item.disabled}
                      className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                        item.disabled
                          ? 'cursor-not-allowed border-border/40 bg-surface-muted opacity-60'
                          : 'cursor-pointer border-border/60 bg-surface hover:border-accent/60 hover:bg-surface-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 text-2xl">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 font-semibold text-foreground">{item.label}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        {!item.disabled && (
                          <span className="flex-shrink-0 text-xl text-muted">→</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Account Info */}
        {userId && (
          <Card className="mt-6 border border-border/60 bg-surface">
            <div className="p-6">
              <h3 className="mb-3 font-bold text-foreground">Account Information</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">User ID:</strong> {userId.substring(0, 8)}...
                </p>
                <p>
                  <strong className="text-foreground">Membership:</strong> {hasAccess ? 'Premium' : 'Free'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Version Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">Networth v1.0.0</p>
          <p className="mt-1 text-xs text-muted">
            Built with research from 552 university students
          </p>
        </div>
      </main>
    </div>
  );
}
