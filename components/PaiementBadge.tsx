import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  paye: { label: 'Payé', bg: '#DCFCE7', text: '#15803D' },
  en_attente: { label: 'En attente', bg: '#FEF3C7', text: '#D97706' },
  partiellement_paye: { label: 'Partiel', bg: '#DBEAFE', text: '#1D4ED8' },
  annule: { label: 'Annulé', bg: '#FEE2E2', text: '#DC2626' },
};

interface PaiementBadgeProps {
  statut: string;
}

export default function PaiementBadge({ statut }: PaiementBadgeProps) {
  const config = STATUT_CONFIG[statut] || { label: statut, bg: '#F3F4F6', text: '#6B7280' };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
