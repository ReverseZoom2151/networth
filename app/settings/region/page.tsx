'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';

interface Region {
  code: string;
  name: string;
  flag: string;
  currency: string;
  timezone?: string;
}

interface RegionGroup {
  title: string;
  subtitle?: string;
  regions: Region[];
}

export default function RegionSettingsPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('US');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    async function loadCurrentRegion() {
      if (!whopLoading && userId) {
        try {
          const response = await fetch(`/api/settings/region?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            setSelectedRegion(data.region || 'US');
          }
        } catch (error) {
          console.error('Failed to load region:', error);
        }
        setLoading(false);
      }
    }
    loadCurrentRegion();
  }, [userId, whopLoading]);

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      // Try to detect location using browser geolocation + timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Map timezone to region (simplified mapping)
      const timezoneToRegion: { [key: string]: string } = {
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'America/Los_Angeles': 'US',
        'America/Toronto': 'CA',
        'America/Vancouver': 'CA',
        'America/Mexico_City': 'MX',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Rome': 'IT',
        'Europe/Madrid': 'ES',
        'Europe/Amsterdam': 'NL',
        'Europe/Brussels': 'BE',
        'Europe/Vienna': 'AT',
        'Europe/Stockholm': 'SE',
        'Europe/Oslo': 'NO',
        'Europe/Copenhagen': 'DK',
        'Europe/Zurich': 'CH',
        'Europe/Warsaw': 'PL',
        'Europe/Prague': 'CZ',
        'Europe/Budapest': 'HU',
        'Europe/Bucharest': 'RO',
        'Europe/Athens': 'GR',
        'Europe/Helsinki': 'FI',
        'Europe/Dublin': 'IE',
        'Europe/Lisbon': 'PT',
        'Asia/Tokyo': 'JP',
        'Asia/Shanghai': 'CN',
        'Asia/Hong_Kong': 'HK',
        'Asia/Singapore': 'SG',
        'Asia/Seoul': 'KR',
        'Asia/Bangkok': 'TH',
        'Asia/Manila': 'PH',
        'Asia/Jakarta': 'ID',
        'Asia/Kolkata': 'IN',
        'Asia/Dubai': 'AE',
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU',
        'Pacific/Auckland': 'NZ',
        'Africa/Johannesburg': 'ZA',
        'Africa/Cairo': 'EG',
        'Africa/Lagos': 'NG',
        'Africa/Nairobi': 'KE',
        'America/Sao_Paulo': 'BR',
        'America/Buenos_Aires': 'AR',
        'America/Santiago': 'CL',
        'America/Bogota': 'CO',
        'America/Lima': 'PE',
      };

      const detectedRegion = timezoneToRegion[timezone] || 'US';
      setSelectedRegion(detectedRegion);

      // Scroll to the detected region
      setTimeout(() => {
        const element = document.getElementById(`region-${detectedRegion}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to detect location:', error);
      alert('Could not detect your location. Please select manually.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSaveRegion = async (regionCode: string, regionName: string, currency: string) => {
    if (!userId) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings/region', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          region: regionCode,
          regionName,
          currency,
        }),
      });

      if (response.ok) {
        setSelectedRegion(regionCode);
        setTimeout(() => {
          router.push('/settings');
        }, 500);
      }
    } catch (error) {
      console.error('Failed to save region:', error);
      alert('Failed to save region. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const regionGroups: RegionGroup[] = [
    {
      title: 'North America',
      regions: [
        { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', timezone: 'America/New_York' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', timezone: 'America/Toronto' },
        { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', timezone: 'America/Mexico_City' },
      ],
    },
    {
      title: 'European Union',
      subtitle: 'EU member states using Euro',
      regions: [
        { code: 'AT', name: 'Austria', flag: '🇦🇹', currency: 'EUR', timezone: 'Europe/Vienna' },
        { code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: 'EUR', timezone: 'Europe/Brussels' },
        { code: 'HR', name: 'Croatia', flag: '🇭🇷', currency: 'EUR', timezone: 'Europe/Zagreb' },
        { code: 'CY', name: 'Cyprus', flag: '🇨🇾', currency: 'EUR', timezone: 'Asia/Nicosia' },
        { code: 'EE', name: 'Estonia', flag: '🇪🇪', currency: 'EUR', timezone: 'Europe/Tallinn' },
        { code: 'FI', name: 'Finland', flag: '🇫🇮', currency: 'EUR', timezone: 'Europe/Helsinki' },
        { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', timezone: 'Europe/Paris' },
        { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', timezone: 'Europe/Berlin' },
        { code: 'GR', name: 'Greece', flag: '🇬🇷', currency: 'EUR', timezone: 'Europe/Athens' },
        { code: 'IE', name: 'Ireland', flag: '🇮🇪', currency: 'EUR', timezone: 'Europe/Dublin' },
        { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', timezone: 'Europe/Rome' },
        { code: 'LV', name: 'Latvia', flag: '🇱🇻', currency: 'EUR', timezone: 'Europe/Riga' },
        { code: 'LT', name: 'Lithuania', flag: '🇱🇹', currency: 'EUR', timezone: 'Europe/Vilnius' },
        { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', currency: 'EUR', timezone: 'Europe/Luxembourg' },
        { code: 'MT', name: 'Malta', flag: '🇲🇹', currency: 'EUR', timezone: 'Europe/Malta' },
        { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', timezone: 'Europe/Amsterdam' },
        { code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR', timezone: 'Europe/Lisbon' },
        { code: 'SK', name: 'Slovakia', flag: '🇸🇰', currency: 'EUR', timezone: 'Europe/Bratislava' },
        { code: 'SI', name: 'Slovenia', flag: '🇸🇮', currency: 'EUR', timezone: 'Europe/Ljubljana' },
        { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', timezone: 'Europe/Madrid' },
      ],
    },
    {
      title: 'Europe (Other)',
      subtitle: 'Non-EU or non-Euro European countries',
      regions: [
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', timezone: 'Europe/London' },
        { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', timezone: 'Europe/Zurich' },
        { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK', timezone: 'Europe/Oslo' },
        { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK', timezone: 'Europe/Stockholm' },
        { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK', timezone: 'Europe/Copenhagen' },
        { code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'PLN', timezone: 'Europe/Warsaw' },
        { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', currency: 'CZK', timezone: 'Europe/Prague' },
        { code: 'HU', name: 'Hungary', flag: '🇭🇺', currency: 'HUF', timezone: 'Europe/Budapest' },
        { code: 'RO', name: 'Romania', flag: '🇷🇴', currency: 'RON', timezone: 'Europe/Bucharest' },
        { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', currency: 'BGN', timezone: 'Europe/Sofia' },
        { code: 'IS', name: 'Iceland', flag: '🇮🇸', currency: 'ISK', timezone: 'Atlantic/Reykjavik' },
        { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY', timezone: 'Europe/Istanbul' },
        { code: 'RU', name: 'Russia', flag: '🇷🇺', currency: 'RUB', timezone: 'Europe/Moscow' },
        { code: 'UA', name: 'Ukraine', flag: '🇺🇦', currency: 'UAH', timezone: 'Europe/Kiev' },
      ],
    },
    {
      title: 'Asia-Pacific',
      regions: [
        { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', timezone: 'Asia/Tokyo' },
        { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', timezone: 'Asia/Shanghai' },
        { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', timezone: 'Asia/Seoul' },
        { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', currency: 'HKD', timezone: 'Asia/Hong_Kong' },
        { code: 'TW', name: 'Taiwan', flag: '🇹🇼', currency: 'TWD', timezone: 'Asia/Taipei' },
        { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', timezone: 'Asia/Singapore' },
        { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur' },
        { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB', timezone: 'Asia/Bangkok' },
        { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP', timezone: 'Asia/Manila' },
        { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'IDR', timezone: 'Asia/Jakarta' },
        { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'VND', timezone: 'Asia/Ho_Chi_Minh' },
        { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', timezone: 'Asia/Kolkata' },
        { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currency: 'PKR', timezone: 'Asia/Karachi' },
        { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT', timezone: 'Asia/Dhaka' },
        { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', currency: 'LKR', timezone: 'Asia/Colombo' },
        { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', timezone: 'Australia/Sydney' },
        { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: 'NZD', timezone: 'Pacific/Auckland' },
      ],
    },
    {
      title: 'Middle East & Africa',
      regions: [
        { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', timezone: 'Asia/Dubai' },
        { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', timezone: 'Asia/Riyadh' },
        { code: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QAR', timezone: 'Asia/Qatar' },
        { code: 'KW', name: 'Kuwait', flag: '🇰🇼', currency: 'KWD', timezone: 'Asia/Kuwait' },
        { code: 'BH', name: 'Bahrain', flag: '🇧🇭', currency: 'BHD', timezone: 'Asia/Bahrain' },
        { code: 'OM', name: 'Oman', flag: '🇴🇲', currency: 'OMR', timezone: 'Asia/Muscat' },
        { code: 'IL', name: 'Israel', flag: '🇮🇱', currency: 'ILS', timezone: 'Asia/Jerusalem' },
        { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', timezone: 'Africa/Cairo' },
        { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', timezone: 'Africa/Johannesburg' },
        { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', timezone: 'Africa/Lagos' },
        { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', timezone: 'Africa/Nairobi' },
        { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', timezone: 'Africa/Accra' },
        { code: 'MA', name: 'Morocco', flag: '🇲🇦', currency: 'MAD', timezone: 'Africa/Casablanca' },
        { code: 'TN', name: 'Tunisia', flag: '🇹🇳', currency: 'TND', timezone: 'Africa/Tunis' },
      ],
    },
    {
      title: 'Latin America',
      regions: [
        { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', timezone: 'America/Sao_Paulo' },
        { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS', timezone: 'America/Buenos_Aires' },
        { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'CLP', timezone: 'America/Santiago' },
        { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP', timezone: 'America/Bogota' },
        { code: 'PE', name: 'Peru', flag: '🇵🇪', currency: 'PEN', timezone: 'America/Lima' },
        { code: 'UY', name: 'Uruguay', flag: '🇺🇾', currency: 'UYU', timezone: 'America/Montevideo' },
        { code: 'VE', name: 'Venezuela', flag: '🇻🇪', currency: 'VES', timezone: 'America/Caracas' },
        { code: 'EC', name: 'Ecuador', flag: '🇪🇨', currency: 'USD', timezone: 'America/Guayaquil' },
      ],
    },
  ];

  const filteredGroups = searchQuery
    ? regionGroups
        .map((group) => ({
          ...group,
          regions: group.regions.filter(
            (r) =>
              r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              r.currency.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.regions.length > 0)
    : regionGroups;

  if (loading) {
    return <LoadingScreen message="Loading region settings..." />;
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back to Settings
          </button>
          <h1 className="mb-3 text-3xl font-bold text-foreground">Region Settings</h1>
          <p className="text-muted">Update your preferred region to get personalized recommendations</p>
        </div>

        {/* Search & Auto-detect */}
        <Card className="mb-6">
          <div className="p-4 space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search regions..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>

            <button
              onClick={detectLocation}
              disabled={detectingLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-700 font-semibold transition-colors disabled:opacity-50"
            >
              <span>📍</span>
              {detectingLocation ? 'Detecting...' : 'Auto-Detect My Region'}
            </button>
          </div>
        </Card>

        {/* Region Groups */}
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <Card key={group.title}>
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{group.title}</h2>
                  {group.subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{group.subtitle}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.regions.map((region) => {
                    const isSelected = selectedRegion === region.code;

                    return (
                      <button
                        key={region.code}
                        id={`region-${region.code}`}
                        onClick={() => handleSaveRegion(region.code, region.name, region.currency)}
                        disabled={saving}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        } ${saving ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl">{region.flag}</span>
                          {isSelected && (
                            <span className="text-xl">✓</span>
                          )}
                        </div>
                        <div className={`font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {region.name}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-gray-200' : 'text-gray-600'}`}>
                          {region.currency} • {region.code}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <Card>
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No regions found</h3>
              <p className="text-gray-600">Try a different search term</p>
            </div>
          </Card>
        )}

        {/* Info */}
        <Card className="mt-6">
          <div className="p-6 bg-blue-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Why Region Matters</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Personalized News:</strong> Get financial news relevant to your location</li>
                  <li>• <strong>Local Products:</strong> See savings accounts, credit cards, and investment options available in your region</li>
                  <li>• <strong>Regulatory Compliance:</strong> Financial advice tailored to your country's laws and regulations</li>
                  <li>• <strong>Currency:</strong> Your currency will be automatically updated based on your region</li>
                  <li>• <strong>Market Hours:</strong> Stock market data aligned with your local timezone</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
