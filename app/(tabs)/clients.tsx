import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { blink } from '@/lib/blink';
import { colors, shadows, borderRadius } from '@/constants/design';
import EliteHeader from '@/components/EliteHeader';
import ClientBadge from '@/components/ClientBadge';
import type { Client } from '@/types';

type Filtre = 'tous' | 'actif' | 'inactif' | 'prospect';

const AVATAR_COLORS = [
  { bg: '#FEF3D4', text: '#A67A09' },
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#E8EBF4', text: '#2A3D6E' },
  { bg: '#FFF7ED', text: '#C2410C' },
];

function getAvatarColor(id: string) {
  const idx = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(nom: string, prenom: string) {
  return `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase();
}

export default function ClientsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: () => blink.db.clients.list({ orderBy: { createdAt: 'desc' } }) as Promise<Client[]>,
  });

  const filtered = clients.filter((c) => {
    const matchSearch =
      search === '' ||
      `${c.nom} ${c.prenom} ${c.email} ${c.telephone} ${c.ville} ${c.secteurActivite}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchFiltre = filtre === 'tous' || c.statut === filtre;
    return matchSearch && matchFiltre;
  });

  const countActif = clients.filter(c => c.statut === 'actif').length;
  const countProspect = clients.filter(c => c.statut === 'prospect').length;
  const countInactif = clients.filter(c => c.statut === 'inactif').length;

  const FILTRES: { key: Filtre; label: string; count: number }[] = [
    { key: 'tous', label: 'Tous', count: clients.length },
    { key: 'actif', label: 'Actifs', count: countActif },
    { key: 'prospect', label: 'Prospects', count: countProspect },
    { key: 'inactif', label: 'Inactifs', count: countInactif },
  ];

  const renderClient = ({ item }: { item: Client }) => {
    const avColor = getAvatarColor(item.id);
    return (
      <TouchableOpacity
        style={[styles.clientCard, shadows.sm]}
        onPress={() => router.push(`/client/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avColor.bg }]}>
          <Text style={[styles.avatarText, { color: avColor.text }]}>
            {getInitials(item.nom, item.prenom)}
          </Text>
        </View>

        {/* Infos */}
        <View style={styles.info}>
          <Text style={styles.name}>{item.prenom} {item.nom}</Text>
          {item.secteurActivite && (
            <View style={styles.secteurRow}>
              <Ionicons name="briefcase-outline" size={11} color={colors.primary} />
              <Text style={styles.secteurText}>{item.secteurActivite}</Text>
            </View>
          )}
          <View style={styles.subRow}>
            {item.telephone && (
              <View style={styles.subItem}>
                <Ionicons name="call-outline" size={11} color={colors.textSecondary} />
                <Text style={styles.subText}>{item.telephone}</Text>
              </View>
            )}
            {item.ville && (
              <View style={styles.subItem}>
                <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                <Text style={styles.subText}>{item.ville}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Droite */}
        <View style={styles.right}>
          <ClientBadge statut={item.statut} />
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginTop: 8 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <EliteHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length > 1 ? 's' : ''} enregistré${clients.length > 1 ? 's' : ''}`}
        rightComponent={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/client/nouveau')}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nom, téléphone, secteur, ville..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres avec compteurs */}
      <View style={styles.filtres}>
        {FILTRES.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtreBtn, filtre === f.key && styles.filtreBtnActive]}
            onPress={() => setFiltre(f.key)}
          >
            <Text style={[styles.filtreTxt, filtre === f.key && styles.filtreTxtActive]}>
              {f.label}
            </Text>
            <View style={[styles.filtreCount, filtre === f.key && styles.filtreCountActive]}>
              <Text style={[styles.filtreCountTxt, filtre === f.key && styles.filtreCountTxtActive]}>
                {f.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Résultats count */}
      {search.length > 0 && (
        <Text style={styles.resultCount}>
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''} pour « {search} »
        </Text>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTxt}>Chargement des clients...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={56} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>Aucun client trouvé</Text>
              <Text style={styles.emptySub}>
                {search
                  ? 'Modifiez votre recherche ou changez le filtre'
                  : 'Appuyez sur + pour ajouter votre premier client'}
              </Text>
              {!search && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push('/client/nouveau')}
                >
                  <Ionicons name="person-add" size={16} color="#FFFFFF" />
                  <Text style={styles.emptyBtnTxt}>Ajouter un client</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingTxt: { fontSize: 13, color: colors.textSecondary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    margin: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: borderRadius.lg, gap: 8, ...shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filtres: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  filtreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filtreBtnActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  filtreTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filtreTxtActive: { color: '#FFFFFF' },
  filtreCount: {
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filtreCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filtreCountTxt: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  filtreCountTxtActive: { color: '#FFFFFF' },
  resultCount: { fontSize: 12, color: colors.textSecondary, paddingHorizontal: 16, marginBottom: 6, fontStyle: 'italic' },
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28 },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg, padding: 14, marginBottom: 10, gap: 12,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 15, fontWeight: '800' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  secteurRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  secteurText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  subRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 1 },
  subItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  subText: { fontSize: 11, color: colors.textSecondary },
  right: { alignItems: 'flex-end' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8,
  },
  emptyBtnTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
