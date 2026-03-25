import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, Alert, RefreshControl, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { blink } from '@/lib/blink';
import { colors, shadows, borderRadius } from '@/constants/design';
import EliteHeader from '@/components/EliteHeader';
import type { Service } from '@/types';

function formatMontant(montant: number) {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

const CATEGORIES = ['Conseil', 'Comptabilité', 'Administratif', 'Traduction', 'Formation', 'Audit', 'Marketing', 'Informatique', 'Logistique', 'Autre'];

const CAT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Conseil: { bg: '#FEF3D4', text: '#A67A09', icon: 'bulb' },
  Comptabilité: { bg: '#DBEAFE', text: '#1D4ED8', icon: 'calculator' },
  Administratif: { bg: '#F3E8FF', text: '#7C3AED', icon: 'document-text' },
  Traduction: { bg: '#DCFCE7', text: '#15803D', icon: 'language' },
  Formation: { bg: '#FCE7F3', text: '#9D174D', icon: 'school' },
  Audit: { bg: '#FEF3C7', text: '#D97706', icon: 'analytics' },
  Marketing: { bg: '#E0F2FE', text: '#0369A1', icon: 'megaphone' },
  Informatique: { bg: '#F0FDF4', text: '#166534', icon: 'laptop' },
  Logistique: { bg: '#FFF7ED', text: '#C2410C', icon: 'car' },
  Autre: { bg: '#F9FAFB', text: '#6B7280', icon: 'apps' },
};

export default function ServicesScreen() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom: '', description: '', prix: '', duree: '', categorie: 'Conseil' });
  const [editId, setEditId] = useState<string | null>(null);

  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => blink.db.services.list({ orderBy: { nom: 'asc' } }) as Promise<Service[]>,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.nom || !form.prix) throw new Error('Nom et prix requis');
      const data = {
        nom: form.nom,
        description: form.description,
        prix: parseFloat(form.prix),
        duree: form.duree,
        categorie: form.categorie,
        actif: 1,
      };
      if (editId) {
        return blink.db.services.update(editId, data);
      } else {
        return blink.db.services.create({ id: `svc_${Date.now()}`, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setModal(false);
      resetForm();
    },
    onError: (err: any) => Alert.alert('Erreur', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blink.db.services.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  function resetForm() {
    setForm({ nom: '', description: '', prix: '', duree: '', categorie: 'Conseil' });
    setEditId(null);
  }

  function openEdit(service: Service) {
    setForm({
      nom: service.nom,
      description: service.description || '',
      prix: String(service.prix),
      duree: service.duree || '',
      categorie: service.categorie || 'Autre',
    });
    setEditId(service.id);
    setModal(true);
  }

  function confirmDelete(id: string, nom: string) {
    Alert.alert(
      'Supprimer le service',
      `Voulez-vous supprimer "${nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]
    );
  }

  const renderService = ({ item }: { item: Service }) => {
    const catConfig = CAT_COLORS[item.categorie || 'Autre'] || CAT_COLORS['Autre'];
    return (
      <View style={[styles.card, shadows.sm]}>
        <View style={[styles.catIcon, { backgroundColor: catConfig.bg }]}>
          <Ionicons name={catConfig.icon as any} size={20} color={catConfig.text} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.nom}</Text>
          {item.categorie && (
            <View style={[styles.catBadge, { backgroundColor: catConfig.bg }]}>
              <Text style={[styles.catBadgeTxt, { color: catConfig.text }]}>{item.categorie}</Text>
            </View>
          )}
          {item.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={styles.cardBottom}>
            <Text style={styles.prix}>{formatMontant(item.prix)}</Text>
            {item.duree && <Text style={styles.duree}>{item.duree}</Text>}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item.id, item.nom)} style={styles.actionBtn}>
            <Ionicons name="trash" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <EliteHeader
        title="Services"
        subtitle={`${services.length} service${services.length > 1 ? 's' : ''} proposé${services.length > 1 ? 's' : ''}`}
        rightComponent={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { resetForm(); setModal(true); }}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderService}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="design-services" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>Aucun service</Text>
              <Text style={styles.emptySub}>Ajoutez vos premiers services</Text>
            </View>
          }
        />
      )}

      {/* Modal Ajout/Édition */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editId ? 'Modifier le service' : 'Nouveau service'}</Text>
            <TouchableOpacity onPress={() => { setModal(false); resetForm(); }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Nom du service *</Text>
            <TextInput
              style={styles.input}
              value={form.nom}
              onChangeText={(v) => setForm({ ...form, nom: v })}
              placeholder="Ex: Conseil Juridique"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={styles.inputLabel}>Prix (FCFA) *</Text>
            <TextInput
              style={styles.input}
              value={form.prix}
              onChangeText={(v) => setForm({ ...form, prix: v })}
              placeholder="Ex: 75000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
            <Text style={styles.inputLabel}>Durée</Text>
            <TextInput
              style={styles.input}
              value={form.duree}
              onChangeText={(v) => setForm({ ...form, duree: v })}
              placeholder="Ex: 1h, Mensuel, Par mission"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={styles.inputLabel}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catOption, form.categorie === cat && styles.catOptionActive]}
                  onPress={() => setForm({ ...form, categorie: cat })}
                >
                  <Text style={[styles.catOptionTxt, form.categorie === cat && styles.catOptionTxtActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Description du service..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.saveBtn, saveMutation.isPending && { opacity: 0.7 }]}
              onPress={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnTxt}>{editId ? 'Enregistrer les modifications' : 'Ajouter le service'}</Text>
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
  list: { padding: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md, padding: 14, marginBottom: 10, gap: 12,
  },
  catIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.text },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  catBadgeTxt: { fontSize: 10, fontWeight: '700' },
  cardDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  prix: { fontSize: 14, fontWeight: '800', color: colors.primary },
  duree: { fontSize: 12, color: colors.textSecondary },
  actions: { gap: 6 },
  actionBtn: { padding: 6 },
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
  inputMulti: { height: 90, textAlignVertical: 'top' },
  catScroll: { marginBottom: 4 },
  catOption: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6',
    marginRight: 8, borderWidth: 1, borderColor: 'transparent',
  },
  catOptionActive: { backgroundColor: colors.secondaryTint, borderColor: colors.secondary },
  catOptionTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  catOptionTxtActive: { color: colors.secondary },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: 16,
    alignItems: 'center', marginTop: 24, marginBottom: 40,
  },
  saveBtnTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
