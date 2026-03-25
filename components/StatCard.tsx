import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius } from '@/constants/design';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  bgColor?: string;
  trend?: string;
}

export default function StatCard({ label, value, icon, color = colors.primary, bgColor = colors.primaryTint, trend }: StatCardProps) {
  return (
    <View style={[styles.card, shadows.sm]}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend && (
        <Text style={[styles.trend, { color }]}>{trend}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  trend: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
