'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '@/components/ui';

interface BudgetTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  region: string;
  allocations: Record<string, number>;
  isDefault?: boolean;
}

interface BudgetTemplatesWidgetProps {
  userId: string;
  onSelectTemplate?: (template: BudgetTemplate) => void;
}

export function BudgetTemplatesWidget({ userId, onSelectTemplate }: BudgetTemplatesWidgetProps) {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [userId]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/budget-templates?userId=${userId}&includePublic=true`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load budget templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: BudgetTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">📋 Budget Templates</h3>
            <p className="text-sm text-gray-600 mt-1">
              Start with a proven budget template
            </p>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No templates available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {template.name}
                        </span>
                        {template.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {template.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">
                          {template.category.charAt(0).toUpperCase() + template.category.slice(1)} • {template.region}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(template.allocations)
                            .slice(0, 4)
                            .map(([category, percentage]) => (
                              <span
                                key={category}
                                className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                              >
                                {category}: {percentage}%
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTemplate(template);
                      }}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

