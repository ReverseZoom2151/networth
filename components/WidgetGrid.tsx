'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { WIDGET_REGISTRY, getAllWidgetConfigs, type WidgetType, type WidgetSize } from '@/lib/widgets/registry';
import NetWorthSummaryWidget from './widgets/NetWorthSummaryWidget';
import SpendingThisMonthWidget from './widgets/SpendingThisMonthWidget';
import ActiveStreaksWidget from './widgets/ActiveStreaksWidget';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: number;
  settings: any;
  isActive: boolean;
}

export default function WidgetGrid({ userId }: { userId: string }) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWidget, setShowAddWidget] = useState(false);

  useEffect(() => {
    fetchWidgets();
  }, [userId]);

  const fetchWidgets = async () => {
    try {
      const response = await fetch(`/api/widgets?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWidgets(data);
      }
    } catch (error) {
      console.error('Failed to fetch widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWidget = async (type: WidgetType) => {
    const config = WIDGET_REGISTRY[type];
    if (!config) return;

    try {
      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type,
          title: config.name,
          size: config.defaultSize,
          settings: config.defaultSettings,
        }),
      });

      if (response.ok) {
        setShowAddWidget(false);
        fetchWidgets();
      }
    } catch (error) {
      console.error('Failed to add widget:', error);
    }
  };

  const removeWidget = async (widgetId: string) => {
    try {
      const response = await fetch(`/api/widgets?id=${widgetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchWidgets();
      }
    } catch (error) {
      console.error('Failed to remove widget:', error);
    }
  };

  const renderWidget = (widget: Widget) => {
    const props = { userId, settings: widget.settings };

    switch (widget.type) {
      case 'net_worth_summary':
        return <NetWorthSummaryWidget {...props} />;
      case 'spending_this_month':
        return <SpendingThisMonthWidget {...props} />;
      case 'active_streaks':
        return <ActiveStreaksWidget {...props} />;
      // Add more widget types here
      default:
        return (
          <Card className="p-6 h-full">
            <p className="text-gray-500">Widget type "{widget.type}" not implemented yet</p>
          </Card>
        );
    }
  };

  const getSizeClass = (size: WidgetSize) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-3';
      case 'full':
        return 'col-span-1 md:col-span-4';
      default:
        return 'col-span-1 md:col-span-2';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-gray-600">Your personalized financial overview</p>
        </div>
        <button
          onClick={() => setShowAddWidget(!showAddWidget)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          {showAddWidget ? 'Cancel' : '+ Add Widget'}
        </button>
      </div>

      {/* Add Widget Panel */}
      {showAddWidget && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Add Widget</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAllWidgetConfigs().map((config) => {
              const alreadyAdded = widgets.some((w) => w.type === config.type);
              return (
                <button
                  key={config.type}
                  onClick={() => !alreadyAdded && addWidget(config.type)}
                  disabled={alreadyAdded}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    alreadyAdded
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                      : 'hover:border-blue-500 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{config.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{config.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                      {alreadyAdded && (
                        <p className="text-xs text-green-600 mt-2">✓ Already added</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Widget Grid */}
      {widgets.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No widgets added yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Add widgets to customize your dashboard and track what matters most
          </p>
          <button
            onClick={() => setShowAddWidget(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Add Your First Widget
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {widgets.map((widget) => (
            <div key={widget.id} className={`relative group ${getSizeClass(widget.size)}`}>
              {/* Remove button */}
              <button
                onClick={() => removeWidget(widget.id)}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm hover:bg-red-600"
                title="Remove widget"
              >
                ×
              </button>

              {/* Widget content */}
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <Card className="p-4 bg-blue-50">
        <p className="text-sm text-gray-700">
          <strong>💡 Tip:</strong> Customize your dashboard by adding widgets that matter most to
          you. Drag and drop to rearrange them (coming soon!).
        </p>
      </Card>
    </div>
  );
}
