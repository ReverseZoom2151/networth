'use client';

interface Product {
  id: string;
  name: string;
  provider: string;
  productType: string;
  interestRate: number | null;
  apr: number | null;
  fees: any;
  primaryBenefit: string;
  secondaryBenefit: string;
  keyFeatures: string[];
  minDeposit: number | null;
  applicationUrl: string | null;
}

interface ProductComparisonProps {
  products: Product[];
  onRemove: (productId: string) => void;
}

export default function ProductComparison({ products, onRemove }: ProductComparisonProps) {
  if (products.length === 0) {
    return null;
  }

  const formatRate = (product: Product) => {
    if (product.interestRate) return `${product.interestRate}% APY`;
    if (product.apr) return `${product.apr}% APR`;
    return 'N/A';
  };

  const formatFees = (fees: any) => {
    if (!fees) return 'N/A';
    const feeList = [];
    if (fees.monthly) feeList.push(`$${fees.monthly}/mo`);
    if (fees.annual) feeList.push(`$${fees.annual}/yr`);
    if (feeList.length === 0 && fees.monthly === 0) return 'No fees';
    return feeList.join(', ') || 'Varies';
  };

  return (
    <div className="bg-white rounded-xl border-2 border-purple-500 shadow-xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Compare Products</h3>
        <span className="text-sm text-gray-600">{products.length} of 3 selected</span>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700 w-32">
                Feature
              </th>
              {products.map((product) => (
                <th key={product.id} className="py-3 px-4 w-64">
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-sm mb-1">{product.name}</p>
                    <p className="text-xs text-gray-600 mb-2">{product.provider}</p>
                    <button
                      onClick={() => onRemove(product.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Rate */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-2 text-sm font-medium text-gray-700">Rate</td>
              {products.map((product) => (
                <td key={product.id} className="py-3 px-4 text-center">
                  <span className="text-lg font-bold text-green-600">{formatRate(product)}</span>
                </td>
              ))}
            </tr>

            {/* Fees */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-2 text-sm font-medium text-gray-700">Fees</td>
              {products.map((product) => (
                <td key={product.id} className="py-3 px-4 text-center">
                  <span className="text-sm text-gray-700">{formatFees(product.fees)}</span>
                </td>
              ))}
            </tr>

            {/* Minimum Deposit */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-2 text-sm font-medium text-gray-700">Min. Deposit</td>
              {products.map((product) => (
                <td key={product.id} className="py-3 px-4 text-center">
                  <span className="text-sm text-gray-700">
                    {product.minDeposit === null || product.minDeposit === 0
                      ? 'None'
                      : `$${product.minDeposit.toLocaleString()}`}
                  </span>
                </td>
              ))}
            </tr>

            {/* Primary Benefit */}
            <tr className="border-b border-gray-100 bg-purple-50">
              <td className="py-3 px-2 text-sm font-medium text-gray-700">Primary Benefit</td>
              {products.map((product) => (
                <td key={product.id} className="py-3 px-4">
                  <p className="text-sm text-gray-900 font-semibold text-center">
                    {product.primaryBenefit}
                  </p>
                </td>
              ))}
            </tr>

            {/* Secondary Benefit */}
            <tr className="border-b border-gray-100 bg-blue-50">
              <td className="py-3 px-2 text-sm font-medium text-gray-700">Secondary Benefit</td>
              {products.map((product) => (
                <td key={product.id} className="py-3 px-4">
                  <p className="text-sm text-gray-900 font-semibold text-center">
                    {product.secondaryBenefit}
                  </p>
                </td>
              ))}
            </tr>

            {/* Key Features */}
            <tr>
              <td className="py-3 px-2 text-sm font-medium text-gray-700 align-top">
                Key Features
              </td>
              {products.map((product) => (
                <td key={product.id} className="py-3 px-4">
                  <ul className="space-y-1 text-left">
                    {product.keyFeatures.slice(0, 5).map((feature, index) => (
                      <li key={index} className="text-xs text-gray-700 flex items-start gap-1">
                        <span className="text-green-600">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        {products.map((product) => (
          product.applicationUrl && (
            <a
              key={product.id}
              href={product.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-black hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center text-sm"
            >
              Apply to {product.provider} →
            </a>
          )
        ))}
      </div>
    </div>
  );
}
