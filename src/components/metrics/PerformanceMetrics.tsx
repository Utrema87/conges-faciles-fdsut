import { useEffect, useState } from 'react';
import { onCLS, onLCP, onINP, onFCP, Metric } from 'web-vitals';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WebVitalsMetrics {
  lcp: number | null;
  fcp: number | null;
  cls: number | null;
  inp: number | null;
}

const getMetricStatus = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FCP: { good: 1800, poor: 3000 },
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

const formatValue = (name: string, value: number): string => {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
};

export const PerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    lcp: null,
    fcp: null,
    cls: null,
    inp: null,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMetric = (metric: Metric) => {
      setMetrics((prev) => ({
        ...prev,
        [metric.name.toLowerCase()]: metric.value,
      }));
    };

    // Enregistrer les callbacks pour chaque métrique
    onLCP(handleMetric);
    onFCP(handleMetric);
    onCLS(handleMetric);
    onINP(handleMetric);

    // Afficher le widget après 3 secondes
    const timer = setTimeout(() => setIsVisible(true), 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const hasMetrics = Object.values(metrics).some((value) => value !== null);
  if (!hasMetrics) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 shadow-lg border-border bg-card z-50 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Web Vitals</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground text-xs"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {metrics.lcp !== null && (
          <MetricRow
            label="LCP"
            value={metrics.lcp}
            status={getMetricStatus('LCP', metrics.lcp)}
            description="Largest Contentful Paint"
          />
        )}

        {metrics.fcp !== null && (
          <MetricRow
            label="FCP"
            value={metrics.fcp}
            status={getMetricStatus('FCP', metrics.fcp)}
            description="First Contentful Paint"
          />
        )}

        {metrics.inp !== null && (
          <MetricRow
            label="INP"
            value={metrics.inp}
            status={getMetricStatus('INP', metrics.inp)}
            description="Interaction to Next Paint"
          />
        )}

        {metrics.cls !== null && (
          <MetricRow
            label="CLS"
            value={metrics.cls}
            status={getMetricStatus('CLS', metrics.cls)}
            description="Cumulative Layout Shift"
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Métriques de performance en temps réel
      </p>
    </Card>
  );
};

interface MetricRowProps {
  label: string;
  value: number;
  status: 'good' | 'needs-improvement' | 'poor';
  description: string;
}

const MetricRow = ({ label, value, status, description }: MetricRowProps) => {
  const statusColors = {
    good: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    'needs-improvement': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    poor: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  };

  const statusLabels = {
    good: 'Bon',
    'needs-improvement': 'Moyen',
    poor: 'Faible',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground" title={description}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatValue(label, value)}
        </span>
      </div>
      <Badge
        variant="outline"
        className={`text-xs ${statusColors[status]}`}
      >
        {statusLabels[status]}
      </Badge>
    </div>
  );
};
