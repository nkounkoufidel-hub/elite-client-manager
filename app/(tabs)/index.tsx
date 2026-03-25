import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { blink } from '@/lib/blink';
import { colors, spacing, shadows, borderRadius } from '@/constants/design';
import EliteHeader from '@/components/EliteHeader';
import StatCard from '@/components/StatCard';
import ClientBadge from '@/components/ClientBadge';
import PaiementBadge from '@/components/PaiementBadge';
import type { Client, Paiement, RendezVous } from '@/types';

function formatMontant(montant: number) {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DashboardScreen() {
  const router = useRouter();

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => blink.db.clients.list({ orderBy: { createdAt: 'desc' } }) as Promise<Client[]>,
  });

  const { data: paiements = [], isLoading: loadingPaiements } = useQuery({
    queryKey: ['paiements'],
    queryFn: () => blink.db.paiements.list({ orderBy: { datePaiement: 'desc' } }) as Promise<Paiement[]>,
  });

  const { data: rdvs = [] } = useQuery({
    queryKey: ['rendez_vous'],
    queryFn: () => blink.db.rendezVous.list({ orderBy: { dateHeure: 'asc' } }) as Promise<RendezVous[]>,
  });

  const clientsActifs = clients.filter(c => c.statut === 'actif').length;
  const clientsProspects = clients.filter(c => c.statut === 'prospect').length;
  const totalCA = paiements.filter(p => p.statut === 'paye').reduce((sum, p) => sum + p.montant, 0);
  const paiementsEnAttente = paiements.filter(p => p.statut === 'en_attente').length;
  const montantEnAttente = paiements.filter(p => p.statut === 'en_attente').reduce((sum, p) => sum + p.montant, 0);

  const recentClients = clients.slice(0, 5);
  const recentPaiements = paiements.slice(0, 4);
  const prochainRdvs = rdvs.filter(r => r.statut === 'planifie').slice(0, 3);

  if (loadingClients || loadingPaiements) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <EliteHeader
        title="Tableau de Bord"
        subtitle={`Bonjour ! ${clients.length} clients au total`}
      />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* KPI Stats */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <StatCard
              label="Clients actifs"
              value={String(clientsActifs)}
              icon={<Ionicons name="people" size={22} color={colors.primary} />}
              color={colors.primary}
              bgColor={colors.primaryTint}
            />
            <StatCard
              label="Chiffre d'affaires"
              value={formatMontant(totalCA)}
              icon={<FontAwesome5 name="chart-line" size={20} color="#15803D" />}
              color="#15803D"
              bgColor="#DCFCE7"
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              label="En attente"
              value={String(paiementsEnAttente)}
              icon={<Ionicons name="time" size={22} color="#D97706" />}
              color="#D97706"
              bgColor="#FEF3C7"
              trend={`${formatMontant(montantEnAttente)}`}
            />
            <StatCard
              label="Prospects"
              value={String(clientsProspects)}
              icon={<Ionicons name="person-add" size={22} color={colors.secondary} />}
              color={colors.secondary}
              bgColor={colors.secondaryTint}
            />
          </View>
        </View>

        {/* RDV à venir */}
        {prochainRdvs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rendez-vous à venir</Text>
            {prochainRdvs.map((rdv) => (
              <View key={rdv.id} style={[styles.rdvCard, shadows.sm]}>
                <View style={styles.rdvIcon}>
                  <Ionicons name="calendar" size={18} color={colors.primary} />
                </View>
                <View style={styles.rdvInfo}>
                  <Text style={styles.rdvTitle}>{rdv.titre}</Text>
                  <Text style={styles.rdvDate}>{formatDate(rdv.dateHeure)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Clients récents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Clients récents</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/clients')}>
              <Text style={styles.voirTout}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {recentClients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={[styles.clientCard, shadows.sm]}
              onPress={() => router.push(`/client/${client.id}`)}
            >
              <View style={[styles.avatar, { backgroundColor: colors.primaryTint }]}>
                <Text style={[styles.avatarText, { color: colors.primaryDark }]}>
                  {client.prenom[0]}{client.nom[0]}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{client.prenom} {client.nom}</Text>
                <Text style={styles.clientSub}>{client.ville || client.email || 'Pas de ville'}</Text>
              </View>
              <ClientBadge statut={client.statut} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Paiements récents */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Paiements récents</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/paiements')}>
              <Text style={styles.voirTout}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {recentPaiements.map((paiement) => {
            const client = clients.find(c => c.id === paiement.clientId);
            return (
              <View key={paiement.id} style={[styles.paiementCard, shadows.sm]}>
                <View style={styles.paiementLeft}>
                  <View style={[styles.paiementIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="cash" size={18} color="#15803D" />
                  </View>
                  <View>
                    <Text style={styles.paiementDesc} numberOfLines={1}>
                      {paiement.description || 'Paiement'}
                    </Text>
                    <Text style={styles.paiementClient}>
                      {client ? `${client.prenom} ${client.nom}` : 'Client inconnu'}
                    </Text>
                  </View>
                </View>
                <View style={styles.paiementRight}>
                  <Text style={styles.paiementMontant}>{formatMontant(paiement.montant)}</Text>
                  <PaiementBadge statut={paiement.statut} />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FC' },
  loadingText: { color: colors.textSecondary, marginTop: 12, fontSize: 14 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  voirTout: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },

  rdvCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md, padding: 12, marginBottom: 8, gap: 12,
  },
  rdvIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  rdvInfo: { flex: 1 },
  rdvTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  rdvDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  clientCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md, padding: 12, marginBottom: 8, gap: 12,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 14, fontWeight: '600', color: colors.text },
  clientSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  paiementCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.md, padding: 12, marginBottom: 8,
  },
  paiementLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  paiementIcon: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },
  paiementDesc: { fontSize: 13, fontWeight: '600', color: colors.text, maxWidth: 160 },
  paiementClient: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  paiementRight: { alignItems: 'flex-end', gap: 4 },
  paiementMontant: { fontSize: 13, fontWeight: '700', color: colors.text },
});
