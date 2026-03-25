import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, Alert, ScrollView, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { blink } from '@/lib/blink';
import { colors, shadows, borderRadius } from '@/constants/design';
import EliteHeader from '@/components/EliteHeader';
import PaiementBadge from '@/components/PaiementBadge';
import type { Paiement, Client, Service } from '@/types';

function formatMontant(montant: number) {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const MODES_PAIEMENT = ['especes', 'virement', 'cheque', 'mobile_money', 'carte'];
const STATUTS = ['paye', 'en_attente', 'partiellement_paye', 'annule'];
const STATUT_LABELS: Record<string, string> = {
  paye: 'Payé', en_attente: 'En attente', partiellement_paye: 'Partiellement payé', annule: 'Annulé',
};
const MODE_LABELS: Record<string, string> = {
  especes: 'Espèces', virement: 'Virement', cheque: 'Chèque', mobile_money: 'Mobile Money', carte: 'Carte',
};

export default function PaiementsScreen() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [form, setForm] = useState({
    clientId: '', serviceId: '', montant: '', statut: 'paye',
    modePaiement: 'especes', reference: '', description: '',
  });

  const { data: paiements = [], isLoading, refetch } = useQuery({
    queryKey: ['paiements'],
    queryFn: () => blink.db.paiements.list({ orderBy: { datePaiement: 'desc' } }) as Promise<Paiement[]>,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => blink.db.clients.list({ orderBy: { nom: 'asc' } }) as Promise<Client[]>,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => blink.db.services.list({ orderBy: { nom: 'asc' } }) as Promise<Service[]>,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!form.clientId || !form.montant) throw new Error('Client et montant requis');
      return blink.db.paiements.create({
        id: `pay_${Date.now()}`,
        clientId: form.clientId,
        serviceId: form.serviceId || undefined,
        montant: parseFloat(form.montant),
        statut: form.statut,
        modePaiement: form.modePaiement,
        reference: form.reference || `REF-${Date.now()}`,
        description: form.description,
        datePaiement: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      setModal(false);
      setForm({ clientId: '', serviceId: '', montant: '', statut: 'paye', modePaiement: 'especes', reference: '', description: '' });
    },
    onError: (err: any) => Alert.alert('Erreur', err.message),
  });

  const filtered = filtreStatut === 'tous' ? paiements : paiements.filter(p => p.statut === filtreStatut);

  const totalPaye = paiements.filter(p => p.statut === 'paye').reduce((s, p) => s + p.montant, 0);
  const totalAttente = paiements.filter(p => p.statut === 'en_attente').reduce((s, p) => s + p.montant, 0);

  const renderPaiement = ({ item }: { item: Paiement }) => {
    const client = clients.find(c => c.id === item.clientId);
    const service = services.find(s => s.id === item.serviceId);
    return (
      <View style={[styles.card, shadows.sm]}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardDesc} numberOfLines={1}>
              {item.description || service?.nom || 'Paiement'}
            </Text>
            <Text style={styles.cardClient}>
              {client ? `${client.prenom} ${client.nom}` : item.clientId}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.montant}>{formatMontant(item.montant)}</Text>
            <PaiementBadge statut={item.statut} />
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.tag}>
            <Ionicons name="calendar-outline" size={11} color={colors.textSecondary} />
            <Text style={styles.tagTxt}>{formatDate(item.datePaiement)}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="card-outline" size={11} color={colors.textSecondary} />
            <Text style={styles.tagTxt}>{MODE_LABELS[item.modePaiement || ''] || item.modePaiement}</Text>
          </View>
          {item.reference && (
            <View style={styles.tag}>
              <Text style={styles.tagTxt}>{item.reference}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <EliteHeader
        title="Paiements"
        subtitle={`${paiements.length} transaction${paiements.length > 1 ? 's' : ''}`}
        rightComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Résumé financier */}
      <View style={styles.resume}>
        <View style={[styles.resumeCard, { backgroundColor: '#F0FDF4' }]}>
          <Text style={styles.resumeLabel}>Total encaissé</Text>
          <Text style={[styles.resumeValue, { color: '#15803D' }]}>{formatMontant(totalPaye)}</Text>
        </View>
        <View style={[styles.resumeCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.resumeLabel}>En attente</Text>
          <Text style={[styles.resumeValue, { color: '#D97706' }]}>{formatMontant(totalAttente)}</Text>
        </View>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtresScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {['tous', ...STATUTS].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filtreBtn, filtreStatut === s && styles.filtreBtnActive]}
            onPress={() => setFiltreStatut(s)}
          >
            <Text style={[styles.filtreTxt, filtreStatut === s && styles.filtreTxtActive]}>
              {s === 'tous' ? 'Tous' : STATUT_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPaiement}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cash-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>Aucun paiement</Text>
              <Text style={styles.emptySub}>Enregistrez votre première transaction</Text>
            </View>
          }
        />
      )}

      {/* Modal Nouveau paiement */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouveau paiement</Text>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Client *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {clients.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.clientChip, form.clientId === c.id && styles.clientChipActive]}
                  onPress={() => setForm({ ...form, clientId: c.id })}
                >
                  <Text style={[styles.clientChipTxt, form.clientId === c.id && styles.clientChipTxtActive]}>
                    {c.prenom} {c.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Service (optionnel)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {services.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.clientChip, form.serviceId === s.id && styles.clientChipActive]}
                  onPress={() => setForm({ ...form, serviceId: s.id, montant: String(s.prix) })}
                >
                  <Text style={[styles.clientChipTxt, form.serviceId === s.id && styles.clientChipTxtActive]}>{s.nom}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Montant (FCFA) *</Text>
            <TextInput
              style={styles.input}
              value={form.montant}
              onChangeText={(v) => setForm({ ...form, montant: v })}
              placeholder="Ex: 75000"
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.inputLabel}>Statut</Text>
            <View style={styles.row}>
              {STATUTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.radioBtn, form.statut === s && styles.radioBtnActive]}
                  onPress={() => setForm({ ...form, statut: s })}
                >
                  <Text style={[styles.radioTxt, form.statut === s && styles.radioTxtActive]}>{STATUT_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Mode de paiement</Text>
            <View style={styles.row}>
              {MODES_PAIEMENT.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.radioBtn, form.modePaiement === m && styles.radioBtnActive]}
                  onPress={() => setForm({ ...form, modePaiement: m })}
                >
                  <Text style={[styles.radioTxt, form.modePaiement === m && styles.radioTxtActive]}>{MODE_LABELS[m]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Description du paiement..."
              placeholderTextColor={colors.textTertiary}
            />

            <TouchableOpacity
              style={[styles.saveBtn, addMutation.isPending && { opacity: 0.7 }]}
              onPress={() => addMutation.mutate()}
              disabled={addMutation.isPending}
            >
              {addMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnTxt}>Enregistrer le paiement</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resume: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 8 },
  resumeCard: { flex: 1, borderRadius: borderRadius.md, padding: 12 },
  resumeLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  resumeValue: { fontSize: 16, fontWeight: '800' },
  filtresScroll: { paddingVertical: 8 },
  filtreBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filtreBtnActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  filtreTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filtreTxtActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.md, padding: 14, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardLeft: { flex: 1, marginRight: 12 },
  cardDesc: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  cardClient: { fontSize: 12, color: colors.textSecondary },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  montant: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagTxt: { fontSize: 11, color: colors.textSecondary },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary },
  modal: { flex: 1, backgroundColor: '#F7F8FC' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBody: { flex: 1, padding: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, fontSize: 14, color: colors.text,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent',
  },
  radioBtnActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  radioTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  radioTxtActive: { color: colors.primaryDark },
  clientChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6',
    marginRight: 8, borderWidth: 1, borderColor: 'transparent',
  },
  clientChipActive: { backgroundColor: colors.secondaryTint, borderColor: colors.secondary },
  clientChipTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  clientChipTxtActive: { color: colors.secondary },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: 16,
    alignItems: 'center', marginTop: 24, marginBottom: 40,
  },
  saveBtnTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
