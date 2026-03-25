import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { blink } from '@/lib/blink';
import { colors, shadows, borderRadius } from '@/constants/design';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type Statut = 'actif' | 'inactif' | 'prospect';

const STATUTS: { key: Statut; label: string; color: string; bg: string; icon: string }[] = [
  { key: 'actif', label: 'Actif', color: '#15803D', bg: '#DCFCE7', icon: 'checkmark-circle' },
  { key: 'prospect', label: 'Prospect', color: '#D97706', bg: '#FEF3C7', icon: 'eye' },
  { key: 'inactif', label: 'Inactif', color: '#DC2626', bg: '#FEE2E2', icon: 'pause-circle' },
];

const SECTEURS = [
  'Commerce & Distribution', 'Immobilier', 'BTP & Construction', 'Éducation & Formation',
  'Santé & Médical', 'Restauration & Hôtellerie', 'Transport & Logistique', 'Banque & Finance',
  'Agriculture & Élevage', 'Pétrole & Mines', 'Télécommunications', 'Industrie & Manufacture',
  'Tourisme & Loisirs', 'ONG & Associations', 'Administration Publique', 'Autre',
];

export default function NouveauClientScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', adresse: '', ville: '',
    statut: 'actif' as Statut, notes: '', secteurActivite: '',
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!form.nom.trim() || !form.prenom.trim()) throw new Error('Le nom et le prénom sont obligatoires');
      return blink.db.clients.create({
        id: `cli_${Date.now()}`,
        nom: form.nom.trim().toUpperCase(),
        prenom: form.prenom.trim(),
        email: form.email.trim() || undefined,
        telephone: form.telephone.trim() || undefined,
        adresse: form.adresse.trim() || undefined,
        ville: form.ville.trim() || undefined,
        statut: form.statut,
        notes: form.notes.trim() || undefined,
        secteurActivite: form.secteurActivite || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      Alert.alert('Client ajouté !', `${form.prenom} ${form.nom.toUpperCase()} a bien été enregistré.`, [
        { text: 'Voir la liste', onPress: () => router.replace('/(tabs)/clients') },
        { text: 'Ajouter un autre', onPress: () => setForm({ nom: '', prenom: '', email: '', telephone: '', adresse: '', ville: '', statut: 'actif', notes: '', secteurActivite: '' }) },
      ]);
    },
    onError: (err: any) => Alert.alert('Erreur', err.message),
  });

  const selectedStatut = STATUTS.find(s => s.key === form.statut)!;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={[colors.secondary, colors.secondaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nouveau client</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Preview avatar */}
          <View style={styles.previewSection}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewAvatarTxt}>
                {form.prenom ? form.prenom[0].toUpperCase() : '?'}
                {form.nom ? form.nom[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.previewName}>
                {form.prenom || form.nom
                  ? `${form.prenom} ${form.nom.toUpperCase()}`.trim()
                  : 'Nouveau client'}
              </Text>
              {form.secteurActivite && (
                <Text style={styles.previewSecteur}>{form.secteurActivite}</Text>
              )}
              <View style={[styles.previewStatut, { backgroundColor: selectedStatut.bg }]}>
                <View style={[styles.previewStatutDot, { backgroundColor: selectedStatut.color }]} />
                <Text style={[styles.previewStatutTxt, { color: selectedStatut.color }]}>{selectedStatut.label}</Text>
              </View>
            </View>
          </View>
          <View style={styles.goldBar} />
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identité */}
        <View style={[styles.section, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Identité</Text>
          </View>

          <Text style={styles.label}>Prénom <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.prenom}
            onChangeText={(v) => setForm({ ...form, prenom: v })}
            placeholder="Ex : Jean-Claude"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Nom de famille <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.nom}
            onChangeText={(v) => setForm({ ...form, nom: v })}
            placeholder="Ex : MBEKI"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
          />
        </View>

        {/* Contact */}
        <View style={[styles.section, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="call" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={form.telephone}
            onChangeText={(v) => setForm({ ...form, telephone: v })}
            placeholder="+241 07 12 34 56"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            placeholder="client@email.com"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Localisation */}
        <View style={[styles.section, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="location" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Localisation</Text>
          </View>

          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            value={form.ville}
            onChangeText={(v) => setForm({ ...form, ville: v })}
            placeholder="Ex : Libreville"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={styles.label}>Adresse complète</Text>
          <TextInput
            style={styles.input}
            value={form.adresse}
            onChangeText={(v) => setForm({ ...form, adresse: v })}
            placeholder="Ex : 12 Rue de l'Indépendance"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Secteur d'activité */}
        <View style={[styles.section, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="briefcase" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Secteur d'activité</Text>
          </View>
          <View style={styles.secteursGrid}>
            {SECTEURS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.secteurChip, form.secteurActivite === s && styles.secteurChipActive]}
                onPress={() => setForm({ ...form, secteurActivite: form.secteurActivite === s ? '' : s })}
              >
                <Text style={[styles.secteurChipTxt, form.secteurActivite === s && styles.secteurChipTxtActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statut */}
        <View style={[styles.section, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="flag" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Statut du client</Text>
          </View>
          <View style={styles.statutRow}>
            {STATUTS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.statutBtn, form.statut === s.key && { backgroundColor: s.bg, borderColor: s.color }]}
                onPress={() => setForm({ ...form, statut: s.key })}
              >
                <Ionicons
                  name={s.icon as any}
                  size={16}
                  color={form.statut === s.key ? s.color : colors.textTertiary}
                />
                <Text style={[styles.statutTxt, form.statut === s.key && { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.section, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="document-text" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Notes internes</Text>
          </View>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={form.notes}
            onChangeText={(v) => setForm({ ...form, notes: v })}
            placeholder="Informations complémentaires sur ce client..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.submitBtn, mutation.isPending && { opacity: 0.7 }, shadows.md]}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.submitTxt}>Enregistrer le client</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 6,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  previewSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 18, gap: 14 },
  previewAvatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.accent,
  },
  previewAvatarTxt: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  previewName: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  previewSecteur: { fontSize: 12, color: colors.accentLight, marginBottom: 4 },
  previewStatut: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  previewStatutDot: { width: 6, height: 6, borderRadius: 3 },
  previewStatutTxt: { fontSize: 11, fontWeight: '700' },
  goldBar: { height: 3, backgroundColor: colors.primary },

  scroll: { flex: 1 },
  section: {
    backgroundColor: '#FFFFFF', margin: 16, marginBottom: 0,
    borderRadius: borderRadius.lg, padding: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionIcon: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },

  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
  required: { color: '#DC2626' },
  input: {
    backgroundColor: '#F7F8FC', borderRadius: borderRadius.md, borderWidth: 1,
    borderColor: '#E5E7EB', padding: 13, fontSize: 14, color: colors.text,
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },

  secteursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secteurChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent',
  },
  secteurChipActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  secteurChipTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  secteurChipTxtActive: { color: colors.primaryDark },

  statutRow: { flexDirection: 'row', gap: 10 },
  statutBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: borderRadius.md,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  statutTxt: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: colors.primary, margin: 16, marginTop: 20, marginBottom: 40,
    borderRadius: borderRadius.lg, padding: 16,
  },
  submitTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
