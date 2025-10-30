'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWhop } from '@/app/providers';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasAccess } = useWhop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    { name: 'Tools', href: '/tools', icon: '🛠️' },
    { name: 'Coach', href: '/coach', icon: '💬', premium: true },
    { name: 'Learn', href: '/credit-score', icon: '📚' },
  ];

  const isActive = (href: string) => pathname === href;

  const handleNavigate = (href: string, premium: boolean = false) => {
    if (premium && !hasAccess) {
      router.push('/subscribe');
      return;
    }
    router.push(href);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 flex-shrink-0"
          >
            <img src="/logo.png" alt="Networth" className="w-8 h-8" />
            <span className="font-bold text-gray-900 text-lg hidden sm:inline">Networth</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.href, item.premium)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isActive(item.href)
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                {item.premium && !hasAccess && (
                  <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                    Pro
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {!hasAccess && (
              <button
                onClick={() => router.push('/subscribe')}
                className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Upgrade
              </button>
            )}
            <button
              onClick={() => router.push('/onboarding')}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Settings
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.href, item.premium)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.premium && !hasAccess && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Pro
                  </span>
                )}
              </button>
            ))}

            <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
              {!hasAccess && (
                <button
                  onClick={() => {
                    router.push('/subscribe');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-black hover:bg-gray-900 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors"
                >
                  Upgrade to Pro
                </button>
              )}
              <button
                onClick={() => {
                  router.push('/onboarding');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
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
