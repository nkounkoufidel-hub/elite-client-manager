import React from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/design';

interface EliteHeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
}

export default function EliteHeader({ title, subtitle, rightComponent }: EliteHeaderProps) {
  return (
    <LinearGradient
      colors={[colors.secondary, colors.secondaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView edges={['top']}>
        <View style={styles.container}>
          <View style={styles.left}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoE}>E</Text>
            </View>
            <View>
              <Text style={styles.brandName}>ELITE SOLUTION</Text>
              <Text style={styles.brandSub}>Multiservices</Text>
            </View>
          </View>
          {rightComponent && (
            <View style={styles.right}>{rightComponent}</View>
          )}
        </View>
        <View style={styles.pageTitle}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.goldAccent} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  logoE: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 10,
    color: colors.accentLight,
    fontWeight: '500',
  },
  pageTitle: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  goldAccent: {
    height: 3,
    backgroundColor: colors.primary,
  },
});
