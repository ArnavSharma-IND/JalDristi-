import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RiskCategory } from '../types/station';
import { RISK_COLORS } from '../types/station';

interface RiskBadgeProps {
  risk?: RiskCategory | null;
  size?: 'small' | 'medium';
}

export default function RiskBadge({ risk, size = 'medium' }: RiskBadgeProps) {
  if (!risk) {
    return (
      <View style={[styles.badge, styles.unclassified, size === 'small' && styles.badgeSmall]}>
        <Text style={[styles.text, styles.unclassifiedText, size === 'small' && styles.textSmall]}>
          Unclassified
        </Text>
      </View>
    );
  }

  const color = RISK_COLORS[risk] || '#94a3b8';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}25`,
          borderColor: `${color}60`,
        },
        size === 'small' && styles.badgeSmall,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, size === 'small' && styles.textSmall]}>
        {risk}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textSmall: {
    fontSize: 10,
  },
  unclassified: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  unclassifiedText: {
    color: '#94a3b8',
  },
});
