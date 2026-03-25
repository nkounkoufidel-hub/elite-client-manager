import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type StatutClient = 'actif' | 'inactif' | 'prospect';

const STATUT_CONFIG: Record<StatutClient, { label: string; bg: string; text: string }> = {
  actif: { label: 'Actif', bg: '#DCFCE7', text: '#15803D' },
  inactif: { label: 'Inactif', bg: '#FEE2E2', text: '#DC2626' },
  prospect: { label: 'Prospect', bg: '#FEF3C7', text: '#D97706' },
};

interface ClientBadgeProps {
  statut: StatutClient | string;
}

export default function ClientBadge({ statut }: ClientBadgeProps) {
  const config = STATUT_CONFIG[statut as StatutClient] || STATUT_CONFIG.inactif;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
