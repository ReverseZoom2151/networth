'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';
import { ProductCard, ProductComparison } from '@/components/products';

interface Product {
  id: string;
  name: string;
  provider: string;
  productType: string;
  region: string;
  interestRate: number | null;
  apr: number | null;
  fees: any;
  description: string;
  keyFeatures: string[];
  primaryBenefit: string;
  secondaryBenefit: string;
  minDeposit: number | null;
  minIncome: number | null;
  minCreditScore: number | null;
  eligibilityNotes: string | null;
  applicationUrl: string | null;
  suitableForGoals: string[];
  riskLevel: string | null;
  featured: boolean;
}

export default function ProductsPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<string>('all');
  const [comparing, setComparing] = useState<string[]>([]);

  useEffect(() => {
    if (whopLoading || !userId) return;
    fetchProducts();
  }, [userId, whopLoading]);

  useEffect(() => {
    applyFilters();
  }, [products, selectedType, selectedRegion, selectedGoal]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.productType === selectedType);
    }

    if (selectedRegion !== 'all') {
      filtered = filtered.filter(p => p.region === selectedRegion || p.region === null);
    }

    if (selectedGoal !== 'all') {
      filtered = filtered.filter(p =>
        p.suitableForGoals.includes(selectedGoal) || p.suitableForGoals.length === 0
      );
    }

    // Sort: featured first, then by priority
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    setFilteredProducts(filtered);
  };

  const toggleCompare = (productId: string) => {
    if (comparing.includes(productId)) {
      setComparing(comparing.filter(id => id !== productId));
    } else {
      if (comparing.length < 3) {
        setComparing([...comparing, productId]);
      } else {
        alert('You can only compare up to 3 products at a time');
      }
    }
  };

  const comparingProducts = products.filter(p => comparing.includes(p.id));

  if (loading) {
    return <LoadingScreen message="Loading products..." />;
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background transition-colors">
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <p className="text-muted">Please log in to view products.</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="mb-3 text-4xl font-bold text-foreground">Financial Products</h1>
          <p className="max-w-3xl text-lg text-muted">
            Find products that help you reach your goal AND build good habits. Every product here
            offers dual benefits - we call them "two-for-one deals."
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border border-border/60 bg-surface p-6 shadow-sm animate-slide-up">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Product Type Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted">
                Product Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground transition focus:border-transparent focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Types</option>
                <option value="savings_account">Savings Accounts</option>
                <option value="checking_account">Checking Accounts</option>
                <option value="credit_card">Credit Cards</option>
                <option value="isa">ISAs (UK)</option>
                <option value="investment_platform">Investment Platforms</option>
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted">
                Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground transition focus:border-transparent focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Regions</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="EU">European Union</option>
              </select>
            </div>

            {/* Goal Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted">
                Goal Type
              </label>
              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground transition focus:border-transparent focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Goals</option>
                <option value="house">🏠 House</option>
                <option value="travel">✈️ Travel</option>
                <option value="wedding">💍 Wedding</option>
                <option value="family">👨‍👩‍👧‍👦 Family</option>
                <option value="investment">📈 Investment</option>
              </select>
            </div>
          </div>

          {/* Results Count & Comparison */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <p>
              Showing {filteredProducts.length} of {products.length} products
            </p>
            {comparing.length > 0 && (
              <button
                onClick={() => {
                  const element = document.getElementById('comparison');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="font-semibold text-accent transition-colors hover:opacity-80"
              >
                Compare Selected ({comparing.length})
              </button>
            )}
          </div>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="border border-border/60 bg-surface p-8 text-center shadow-sm">
            <div className="mb-4 text-5xl">🔍</div>
            <p className="mb-2 text-muted">No products match your filters</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
          </Card>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onCompare={toggleCompare}
                isComparing={comparing.includes(product.id)}
              />
            ))}
          </div>
        )}

        {/* Comparison Section */}
        {comparing.length > 0 && (
          <div id="comparison" className="mb-8">
            <ProductComparison
              products={comparingProducts}
              onRemove={toggleCompare}
            />
          </div>
        )}

        {/* Info Section */}
        <Card className="border border-border/60 bg-surface-muted p-6 shadow-sm animate-slide-up dark:bg-surface/70">
          <div className="flex items-start gap-4">
            <span className="text-4xl">💡</span>
            <div>
              <h3 className="mb-2 font-bold text-foreground">About "Two-for-One Deals"</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Based on research with 552 university students, we found people want products that
                don't just help their goal, but also build good financial habits.
              </p>
              <p className="mb-3 text-sm text-muted-foreground">
                Every product here offers dual benefits:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-500">1.</span>
                  <span>
                    <strong>Direct benefit:</strong> Higher interest rates, rewards, no fees
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500">2.</span>
                  <span>
                    <strong>Habit benefit:</strong> Automatic savings, budgeting tools, credit building
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
