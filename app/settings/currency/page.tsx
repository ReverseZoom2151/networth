'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  country?: string;
}

interface CurrencyGroup {
  title: string;
  currencies: Currency[];
}

export default function CurrencySettingsPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadCurrentCurrency() {
      if (!whopLoading && userId) {
        try {
          const response = await fetch(`/api/settings/currency?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            setSelectedCurrency(data.currency || 'USD');
          }
        } catch (error) {
          console.error('Failed to load currency:', error);
        }
        setLoading(false);
      }
    }
    loadCurrentCurrency();
  }, [userId, whopLoading]);

  const handleSaveCurrency = async (currencyCode: string) => {
    if (!userId) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currency: currencyCode }),
      });

      if (response.ok) {
        setSelectedCurrency(currencyCode);
        setTimeout(() => {
          router.push('/settings');
        }, 500);
      }
    } catch (error) {
      console.error('Failed to save currency:', error);
      alert('Failed to save currency. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currencyGroups: CurrencyGroup[] = [
    {
      title: 'European Union (EUR)',
      currencies: [
        { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union' },
        { code: 'EUR-AT', name: 'Euro', symbol: '€', country: 'Austria' },
        { code: 'EUR-BE', name: 'Euro', symbol: '€', country: 'Belgium' },
        { code: 'EUR-HR', name: 'Euro', symbol: '€', country: 'Croatia' },
        { code: 'EUR-CY', name: 'Euro', symbol: '€', country: 'Cyprus' },
        { code: 'EUR-EE', name: 'Euro', symbol: '€', country: 'Estonia' },
        { code: 'EUR-FI', name: 'Euro', symbol: '€', country: 'Finland' },
        { code: 'EUR-FR', name: 'Euro', symbol: '€', country: 'France' },
        { code: 'EUR-DE', name: 'Euro', symbol: '€', country: 'Germany' },
        { code: 'EUR-GR', name: 'Euro', symbol: '€', country: 'Greece' },
        { code: 'EUR-IE', name: 'Euro', symbol: '€', country: 'Ireland' },
        { code: 'EUR-IT', name: 'Euro', symbol: '€', country: 'Italy' },
        { code: 'EUR-LV', name: 'Euro', symbol: '€', country: 'Latvia' },
        { code: 'EUR-LT', name: 'Euro', symbol: '€', country: 'Lithuania' },
        { code: 'EUR-LU', name: 'Euro', symbol: '€', country: 'Luxembourg' },
        { code: 'EUR-MT', name: 'Euro', symbol: '€', country: 'Malta' },
        { code: 'EUR-NL', name: 'Euro', symbol: '€', country: 'Netherlands' },
        { code: 'EUR-PT', name: 'Euro', symbol: '€', country: 'Portugal' },
        { code: 'EUR-SK', name: 'Euro', symbol: '€', country: 'Slovakia' },
        { code: 'EUR-SI', name: 'Euro', symbol: '€', country: 'Slovenia' },
        { code: 'EUR-ES', name: 'Euro', symbol: '€', country: 'Spain' },
      ],
    },
    {
      title: 'Other European Currencies',
      currencies: [
        { code: 'GBP', name: 'British Pound Sterling', symbol: '£', country: 'United Kingdom' },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland' },
        { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', country: 'Norway' },
        { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', country: 'Sweden' },
        { code: 'DKK', name: 'Danish Krone', symbol: 'kr', country: 'Denmark' },
        { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', country: 'Poland' },
        { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', country: 'Czech Republic' },
        { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', country: 'Hungary' },
        { code: 'RON', name: 'Romanian Leu', symbol: 'lei', country: 'Romania' },
        { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', country: 'Bulgaria' },
        { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', country: 'Iceland' },
        { code: 'TRY', name: 'Turkish Lira', symbol: '₺', country: 'Turkey' },
        { code: 'RUB', name: 'Russian Ruble', symbol: '₽', country: 'Russia' },
        { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', country: 'Ukraine' },
      ],
    },
    {
      title: 'Americas',
      currencies: [
        { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada' },
        { code: 'MXN', name: 'Mexican Peso', symbol: '$', country: 'Mexico' },
        { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil' },
        { code: 'ARS', name: 'Argentine Peso', symbol: '$', country: 'Argentina' },
        { code: 'CLP', name: 'Chilean Peso', symbol: '$', country: 'Chile' },
        { code: 'COP', name: 'Colombian Peso', symbol: '$', country: 'Colombia' },
        { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', country: 'Peru' },
        { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', country: 'Uruguay' },
        { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.', country: 'Venezuela' },
      ],
    },
    {
      title: 'Asia-Pacific',
      currencies: [
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China' },
        { code: 'KRW', name: 'South Korean Won', symbol: '₩', country: 'South Korea' },
        { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', country: 'Hong Kong' },
        { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', country: 'Taiwan' },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore' },
        { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', country: 'Malaysia' },
        { code: 'THB', name: 'Thai Baht', symbol: '฿', country: 'Thailand' },
        { code: 'PHP', name: 'Philippine Peso', symbol: '₱', country: 'Philippines' },
        { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', country: 'Indonesia' },
        { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', country: 'Vietnam' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
        { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', country: 'Pakistan' },
        { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', country: 'Bangladesh' },
        { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', country: 'Sri Lanka' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia' },
        { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', country: 'New Zealand' },
      ],
    },
    {
      title: 'Middle East & Africa',
      currencies: [
        { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates' },
        { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', country: 'Saudi Arabia' },
        { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', country: 'Qatar' },
        { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', country: 'Kuwait' },
        { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', country: 'Bahrain' },
        { code: 'OMR', name: 'Omani Rial', symbol: '﷼', country: 'Oman' },
        { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', country: 'Israel' },
        { code: 'EGP', name: 'Egyptian Pound', symbol: '£', country: 'Egypt' },
        { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya' },
        { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', country: 'Ghana' },
        { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', country: 'Morocco' },
        { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', country: 'Tunisia' },
      ],
    },
    {
      title: 'Cryptocurrencies',
      currencies: [
        { code: 'BTC', name: 'Bitcoin', symbol: '₿', country: 'Digital' },
        { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', country: 'Digital' },
        { code: 'USDT', name: 'Tether', symbol: '₮', country: 'Digital' },
        { code: 'USDC', name: 'USD Coin', symbol: 'USDC', country: 'Digital' },
      ],
    },
  ];

  const filteredGroups = searchQuery
    ? currencyGroups
        .map((group) => ({
          ...group,
          currencies: group.currencies.filter(
            (c) =>
              c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.country?.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.currencies.length > 0)
    : currencyGroups;

  if (loading) {
    return <LoadingScreen message="Loading currency settings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back to Settings
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Currency Settings</h1>
          <p className="text-gray-600">Choose your preferred currency for displaying amounts</p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search currencies..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>
        </Card>

        {/* Currency Groups */}
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <Card key={group.title}>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{group.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.currencies.map((currency) => {
                    const isSelected = selectedCurrency === currency.code;
                    const displayCode = currency.code.startsWith('EUR-')
                      ? 'EUR'
                      : currency.code;

                    return (
                      <button
                        key={currency.code}
                        onClick={() => handleSaveCurrency(currency.code)}
                        disabled={saving}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        } ${saving ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-lg mb-1">
                              {currency.symbol} {displayCode}
                            </div>
                            <div className={`text-sm ${isSelected ? 'text-gray-200' : 'text-gray-600'}`}>
                              {currency.name}
                            </div>
                            {currency.country && (
                              <div className={`text-xs mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                                {currency.country}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-2xl">✓</span>
                          )}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">No currencies found</h3>
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
                <h3 className="font-bold text-gray-900 mb-2">About Currency Settings</h3>
                <p className="text-sm text-gray-700">
                  Your selected currency will be used to display all amounts throughout the app.
                  Exchange rates are updated daily for accurate conversions.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
