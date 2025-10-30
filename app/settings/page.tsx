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
          label: 'Notifications',
          description: 'Coming soon - Manage email and push notifications',
          disabled: true,
          icon: '🔔',
        },
        {
          label: 'Currency',
          description: 'Coming soon - Change your preferred currency',
          disabled: true,
          icon: '💱',
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <Card key={section.title}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{section.icon}</span>
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                </div>

                <div className="space-y-3">
                  {section.items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={item.action || (() => {})}
                      disabled={item.disabled}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        item.disabled
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">{item.label}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        {!item.disabled && (
                          <span className="text-gray-400 text-xl flex-shrink-0">→</span>
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
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">Account Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>User ID:</strong> {userId.substring(0, 8)}...
                </p>
                <p>
                  <strong>Membership:</strong> {hasAccess ? 'Premium' : 'Free'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Version Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Networth v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">
            Built with research from 552 university students
          </p>
        </div>
      </main>
    </div>
  );
}
