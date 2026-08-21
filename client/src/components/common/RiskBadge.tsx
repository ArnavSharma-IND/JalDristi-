import type { RiskCategory } from '../../types/station';

interface RiskBadgeProps {
  risk: RiskCategory | undefined | null;
  size?: 'sm' | 'md';
}

const RISK_CLASS_MAP: Record<RiskCategory, string> = {
  'Safe': 'risk-badge--safe',
  'Semi-Critical': 'risk-badge--semi-critical',
  'Critical': 'risk-badge--critical',
  'Over-Exploited': 'risk-badge--over-exploited',
};

export default function RiskBadge({ risk, size = 'md' }: RiskBadgeProps) {
  if (!risk) {
    return (
      <span className="risk-badge" style={{ opacity: 0.5 }}>
        Unclassified
      </span>
    );
  }

  return (
    <span
      className={isk-badge \}
      style={size === 'sm' ? { fontSize: '0.65rem', padding: '2px 8px' } : {}}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      {risk}
    </span>
  );
}
