import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, Linking, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { blink } from '@/lib/blink';
import { colors, shadows, borderRadius } from '@/constants/design';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ClientBadge from '@/components/ClientBadge';
import PaiementBadge from '@/components/PaiementBadge';
import type { Client, Paiement, RendezVous, Service } from '@/types';

function formatMontant(m: number) {
  return new Intl.NumberFormat('fr-FR').format(m) + ' FCFA';
}
function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatDateTime(d?: string) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

type Statut = 'actif' | 'inactif' | 'prospect';

const STATUTS_CONFIG: { key: Statut; label: string; color: string; bg: string }[] = [
  { key: 'actif', label: 'Actif', color: '#15803D', bg: '#DCFCE7' },
  { key: 'prospect', label: 'Prospect', color: '#D97706', bg: '#FEF3C7' },
  { key: 'inactif', label: 'Inactif', color: '#DC2626', bg: '#FEE2E2' },
];

const SECTEURS = [
  'Commerce & Distribution', 'Immobilier', 'BTP & Construction', 'Éducation & Formation',
  'Santé & Médical', 'Restauration & Hôtellerie', 'Transport & Logistique', 'Banque & Finance',
  'Agriculture & Élevage', 'Pétrole & Mines', 'Télécommunications', 'Industrie & Manufacture',
  'Tourisme & Loisirs', 'ONG & Associations', 'Administration Publique', 'Autre',
];

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

// Intervention = paiement OU rendez-vous, trié par date
type Intervention =
  | { type: 'paiement'; date: string; data: Paiement; service?: Service }
  | { type: 'rdv'; date: string; data: RendezVous; service?: Service };

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [activeTab, setActiveTab] = useState<'infos' | 'interventions' | 'paiements'>('infos');

  const { data: allClients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => blink.db.clients.list() as Promise<Client[]>,
  });

  const { data: paiements = [] } = useQuery({
    queryKey: ['paiements'],
    queryFn: () => blink.db.paiements.list() as Promise<Paiement[]>,
  });

  const { data: rdvs = [] } = useQuery({
    queryKey: ['rendez_vous'],
    queryFn: () => blink.db.rendezVous.list() as Promise<RendezVous[]>,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => blink.db.services.list() as Promise<Service[]>,
  });

  const client = allClients.find(c => c.id === id);
  const clientPaiements = paiements.filter(p => p.clientId === id);
  const clientRdvs = rdvs.filter(r => r.clientId === id);
  const totalPaye = clientPaiements.filter(p => p.statut === 'paye').reduce((s, p) => s + p.montant, 0);
  const totalAttente = clientPaiements.filter(p => p.statut === 'en_attente').reduce((s, p) => s + p.montant, 0);

  // Construire la timeline des interventions
  const interventions: Intervention[] = [
    ...clientPaiements.map(p => ({
      type: 'paiement' as const,
      date: p.datePaiement || p.createdAt || '',
      data: p,
      service: services.find(s => s.id === p.serviceId),
    })),
    ...clientRdvs.map(r => ({
      type: 'rdv' as const,
      date: r.dateHeure,
      data: r,
      service: services.find(s => s.id === r.serviceId),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Client>) => blink.db.clients.update(id!, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditModal(false);
    },
    onError: (err: any) => Alert.alert('Erreur', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => blink.db.clients.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.replace('/(tabs)/clients');
    },
  });

  function openEdit() {
    if (!client) return;
    setEditForm({
      nom: client.nom, prenom: client.prenom, email: client.email,
      telephone: client.telephone, adresse: client.adresse, ville: client.ville,
      statut: client.statut, notes: client.notes, secteurActivite: client.secteurActivite,
    });
    setEditModal(true);
  }

  function confirmDelete() {
    Alert.alert(
      'Supprimer le client',
      `Voulez-vous vraiment supprimer ${client?.prenom} ${client?.nom} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  }

  function handleCall() {
    if (!client?.telephone) return;
    const tel = client.telephone.replace(/\s/g, '');
    Linking.openURL(`tel:${tel}`).catch(() =>
      Alert.alert('Erreur', 'Impossible d\'ouvrir le téléphone')
    );
  }

  function handleWhatsApp() {
    if (!client?.telephone) return;
    const tel = client.telephone.replace(/[\s+]/g, '');
    const number = tel.startsWith('00') ? tel.slice(2) : tel;
    const msg = encodeURIComponent(
      `Bonjour ${client.prenom}, je me permets de vous contacter de la part d'ELITE SOLUTION Multiservices.`
    );
    Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
      Alert.alert('Erreur', 'WhatsApp n\'est pas installé')
    );
  }

  function handleEmail() {
    if (!client?.email) return;
    Linking.openURL(`mailto:${client.email}`).catch(() =>
      Alert.alert('Erreur', 'Impossible d\'ouvrir la messagerie')
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFound}>Client introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkTxt}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avColor = getAvatarColor(client.id);

  return (
    <View style={styles.screen}>
      {/* Header gradient */}
      <LinearGradient colors={[colors.secondary, colors.secondaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          {/* Barre de navigation */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.navTitle} numberOfLines={1}>Fiche client</Text>
            <View style={styles.navActions}>
              <TouchableOpacity onPress={openEdit} style={styles.navBtn}>
                <Ionicons name="pencil" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={styles.navBtn}>
                <Ionicons name="trash-outline" size={18} color="#FCA5A5" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero profil */}
          <View style={styles.hero}>
            <View style={[styles.heroAvatar, { backgroundColor: avColor.bg }]}>
              <Text style={[styles.heroAvatarTxt, { color: avColor.text }]}>
                {client.prenom[0]}{client.nom[0]}
              </Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{client.prenom} {client.nom}</Text>
              {client.secteurActivite && (
                <View style={styles.heroSecteur}>
                  <Ionicons name="briefcase-outline" size={12} color={colors.accentLight} />
                  <Text style={styles.heroSecteurTxt}>{client.secteurActivite}</Text>
                </View>
              )}
              <View style={{ marginTop: 6 }}>
                <ClientBadge statut={client.statut} />
              </View>
            </View>
          </View>

          {/* Stats financières */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{formatMontant(totalPaye)}</Text>
              <Text style={styles.statLbl}>Encaissé</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, totalAttente > 0 && { color: '#FCD34D' }]}>
                {formatMontant(totalAttente)}
              </Text>
              <Text style={styles.statLbl}>En attente</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{interventions.length}</Text>
              <Text style={styles.statLbl}>Interventions</Text>
            </View>
          </View>

          {/* Boutons d'action rapide */}
          {(client.telephone || client.email) && (
            <View style={styles.actionBtns}>
              {client.telephone && (
                <TouchableOpacity style={[styles.actionBtn, styles.actionCall]} onPress={handleCall}>
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnTxt}>Appeler</Text>
                </TouchableOpacity>
              )}
              {client.telephone && (
                <TouchableOpacity style={[styles.actionBtn, styles.actionWhatsApp]} onPress={handleWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnTxt}>WhatsApp</Text>
                </TouchableOpacity>
              )}
              {client.email && (
                <TouchableOpacity style={[styles.actionBtn, styles.actionEmail]} onPress={handleEmail}>
                  <Ionicons name="mail" size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnTxt}>Email</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Onglets */}
          <View style={styles.tabs}>
            {[
              { key: 'infos', label: 'Informations' },
              { key: 'interventions', label: `Interventions (${interventions.length})` },
              { key: 'paiements', label: `Paiements (${clientPaiements.length})` },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text style={[styles.tabTxt, activeTab === tab.key && styles.tabTxtActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Contenu selon onglet */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'infos' && (
          <InfosTab client={client} />
        )}
        {activeTab === 'interventions' && (
          <InterventionsTab interventions={interventions} />
        )}
        {activeTab === 'paiements' && (
          <PaiementsTab paiements={clientPaiements} services={services} />
        )}
      </ScrollView>

      {/* Modal édition */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier le client</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={editForm.prenom}
              onChangeText={(v) => setEditForm({ ...editForm, prenom: v })}
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              value={editForm.nom}
              onChangeText={(v) => setEditForm({ ...editForm, nom: v })}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
            />
            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={editForm.telephone || ''}
              onChangeText={(v) => setEditForm({ ...editForm, telephone: v })}
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={editForm.email || ''}
              onChangeText={(v) => setEditForm({ ...editForm, email: v })}
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Ville</Text>
            <TextInput
              style={styles.input}
              value={editForm.ville || ''}
              onChangeText={(v) => setEditForm({ ...editForm, ville: v })}
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={styles.inputLabel}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={editForm.adresse || ''}
              onChangeText={(v) => setEditForm({ ...editForm, adresse: v })}
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={styles.inputLabel}>Secteur d'activité</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {SECTEURS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, editForm.secteurActivite === s && styles.chipActive]}
                  onPress={() => setEditForm({ ...editForm, secteurActivite: s })}
                >
                  <Text style={[styles.chipTxt, editForm.secteurActivite === s && styles.chipTxtActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>Statut</Text>
            <View style={styles.statutRow}>
              {STATUTS_CONFIG.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.statutBtn, editForm.statut === s.key && { backgroundColor: s.bg, borderColor: s.color }]}
                  onPress={() => setEditForm({ ...editForm, statut: s.key })}
                >
                  {editForm.statut === s.key && <Ionicons name="checkmark" size={13} color={s.color} />}
                  <Text style={[styles.statutTxt, editForm.statut === s.key && { color: s.color }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={editForm.notes || ''}
              onChangeText={(v) => setEditForm({ ...editForm, notes: v })}
              placeholderTextColor={colors.textTertiary}
              multiline
            />
            <TouchableOpacity
              style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.7 }]}
              onPress={() => updateMutation.mutate(editForm)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnTxt}>Enregistrer les modifications</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Onglet Informations ─────────────────────────────────────────────────────

function InfosTab({ client }: { client: Client }) {
  return (
    <View style={{ paddingBottom: 32 }}>
      {/* Coordonnées */}
      <View style={[tabStyles.card, shadows.sm]}>
        <Text style={tabStyles.cardTitle}>
          <Ionicons name="person" size={14} color={colors.primary} /> Coordonnées
        </Text>
        {client.telephone ? (
          <View style={tabStyles.row}>
            <View style={[tabStyles.rowIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="call" size={15} color="#15803D" />
            </View>
            <View>
              <Text style={tabStyles.rowLabel}>Téléphone</Text>
              <Text style={tabStyles.rowVal}>{client.telephone}</Text>
            </View>
          </View>
        ) : (
          <View style={tabStyles.row}>
            <View style={[tabStyles.rowIcon, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="call-outline" size={15} color={colors.textTertiary} />
            </View>
            <Text style={tabStyles.rowEmpty}>Aucun téléphone</Text>
          </View>
        )}
        {client.email ? (
          <View style={tabStyles.row}>
            <View style={[tabStyles.rowIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="mail" size={15} color="#1D4ED8" />
            </View>
            <View>
              <Text style={tabStyles.rowLabel}>Email</Text>
              <Text style={tabStyles.rowVal}>{client.email}</Text>
            </View>
          </View>
        ) : (
          <View style={tabStyles.row}>
            <View style={[tabStyles.rowIcon, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="mail-outline" size={15} color={colors.textTertiary} />
            </View>
            <Text style={tabStyles.rowEmpty}>Aucun email</Text>
          </View>
        )}
      </View>

      {/* Localisation */}
      <View style={[tabStyles.card, shadows.sm]}>
        <Text style={tabStyles.cardTitle}>
          <Ionicons name="location" size={14} color={colors.primary} /> Localisation
        </Text>
        <View style={tabStyles.row}>
          <View style={[tabStyles.rowIcon, { backgroundColor: '#FEF3D4' }]}>
            <Ionicons name="map" size={15} color={colors.primaryDark} />
          </View>
          <View>
            <Text style={tabStyles.rowLabel}>Ville</Text>
            <Text style={tabStyles.rowVal}>{client.ville || '—'}</Text>
          </View>
        </View>
        {client.adresse && (
          <View style={tabStyles.row}>
            <View style={[tabStyles.rowIcon, { backgroundColor: '#FEF3D4' }]}>
              <Ionicons name="home" size={15} color={colors.primaryDark} />
            </View>
            <View>
              <Text style={tabStyles.rowLabel}>Adresse</Text>
              <Text style={tabStyles.rowVal}>{client.adresse}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Secteur d'activité */}
      <View style={[tabStyles.card, shadows.sm]}>
        <Text style={tabStyles.cardTitle}>
          <Ionicons name="briefcase" size={14} color={colors.primary} /> Secteur d'activité
        </Text>
        {client.secteurActivite ? (
          <View style={tabStyles.secteurBadge}>
            <Ionicons name="business" size={16} color={colors.primary} />
            <Text style={tabStyles.secteurTxt}>{client.secteurActivite}</Text>
          </View>
        ) : (
          <Text style={tabStyles.rowEmpty}>Non renseigné</Text>
        )}
      </View>

      {/* Notes */}
      {client.notes && (
        <View style={[tabStyles.card, shadows.sm]}>
          <Text style={tabStyles.cardTitle}>
            <Ionicons name="document-text" size={14} color={colors.primary} /> Notes internes
          </Text>
          <View style={tabStyles.notesBox}>
            <Text style={tabStyles.notesTxt}>{client.notes}</Text>
          </View>
        </View>
      )}

      {/* Date d'ajout */}
      <Text style={tabStyles.dateTxt}>
        Client enregistré le {formatDate(client.createdAt)}
      </Text>
    </View>
  );
}

// ─── Onglet Interventions ────────────────────────────────────────────────────

function InterventionsTab({ interventions }: { interventions: Intervention[] }) {
  if (interventions.length === 0) {
    return (
      <View style={tabStyles.empty}>
        <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
        <Text style={tabStyles.emptyTitle}>Aucune intervention</Text>
        <Text style={tabStyles.emptySub}>Les paiements et rendez-vous apparaîtront ici</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
      <Text style={tabStyles.timelineTitle}>Chronologie des interventions</Text>
      {interventions.map((item, index) => (
        <View key={index} style={tabStyles.timelineItem}>
          {/* Ligne verticale */}
          <View style={tabStyles.timelineLine}>
            <View style={[
              tabStyles.timelineDot,
              {
                backgroundColor: item.type === 'paiement'
                  ? (item.data as Paiement).statut === 'paye' ? '#15803D'
                    : (item.data as Paiement).statut === 'annule' ? '#DC2626' : '#D97706'
                  : (item.data as RendezVous).statut === 'planifie' ? colors.primary
                    : (item.data as RendezVous).statut === 'termine' ? '#15803D' : '#DC2626',
              }
            ]}>
              <Ionicons
                name={item.type === 'paiement' ? 'cash' : 'calendar'}
                size={12}
                color="#FFFFFF"
              />
            </View>
            {index < interventions.length - 1 && <View style={tabStyles.timelineConnector} />}
          </View>

          {/* Contenu */}
          <View style={[tabStyles.timelineCard, shadows.sm]}>
            <View style={tabStyles.timelineCardHeader}>
              <View style={tabStyles.timelineType}>
                <View style={[
                  tabStyles.typeBadge,
                  { backgroundColor: item.type === 'paiement' ? '#F0FDF4' : colors.primaryTint }
                ]}>
                  <Text style={[
                    tabStyles.typeBadgeTxt,
                    { color: item.type === 'paiement' ? '#15803D' : colors.primaryDark }
                  ]}>
                    {item.type === 'paiement' ? '💰 Paiement' : '📅 Rendez-vous'}
                  </Text>
                </View>
              </View>
              <Text style={tabStyles.timelineDate}>{formatDate(item.date)}</Text>
            </View>

            {item.type === 'paiement' ? (
              <>
                <Text style={tabStyles.timelineTitle2}>
                  {(item.data as Paiement).description || item.service?.nom || 'Paiement'}
                </Text>
                <View style={tabStyles.timelineRow}>
                  <Text style={tabStyles.timelineMontant}>
                    {formatMontant((item.data as Paiement).montant)}
                  </Text>
                  <PaiementBadge statut={(item.data as Paiement).statut} />
                </View>
                {(item.data as Paiement).modePaiement && (
                  <Text style={tabStyles.timelineSub}>
                    Mode : {(item.data as Paiement).modePaiement}
                    {(item.data as Paiement).reference ? ` • Réf: ${(item.data as Paiement).reference}` : ''}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={tabStyles.timelineTitle2}>{(item.data as RendezVous).titre}</Text>
                {(item.data as RendezVous).description && (
                  <Text style={tabStyles.timelineSub}>{(item.data as RendezVous).description}</Text>
                )}
                <View style={tabStyles.timelineRow}>
                  <Text style={tabStyles.timelineSub}>
                    {(item.data as RendezVous).dureeMinutes} min
                    {item.service ? ` • ${item.service.nom}` : ''}
                  </Text>
                  <View style={[
                    tabStyles.rdvStatutBadge,
                    {
                      backgroundColor:
                        (item.data as RendezVous).statut === 'planifie' ? colors.primaryTint :
                        (item.data as RendezVous).statut === 'termine' ? '#DCFCE7' : '#FEE2E2',
                    }
                  ]}>
                    <Text style={[
                      tabStyles.rdvStatutTxt,
                      {
                        color:
                          (item.data as RendezVous).statut === 'planifie' ? colors.primaryDark :
                          (item.data as RendezVous).statut === 'termine' ? '#15803D' : '#DC2626',
                      }
                    ]}>
                      {(item.data as RendezVous).statut === 'planifie' ? 'Planifié' :
                       (item.data as RendezVous).statut === 'termine' ? 'Terminé' :
                       (item.data as RendezVous).statut === 'confirme' ? 'Confirmé' : 'Annulé'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Onglet Paiements ────────────────────────────────────────────────────────

function PaiementsTab({ paiements, services }: { paiements: Paiement[]; services: Service[] }) {
  const totalPaye = paiements.filter(p => p.statut === 'paye').reduce((s, p) => s + p.montant, 0);
  const totalAttente = paiements.filter(p => p.statut === 'en_attente').reduce((s, p) => s + p.montant, 0);

  if (paiements.length === 0) {
    return (
      <View style={tabStyles.empty}>
        <Ionicons name="cash-outline" size={48} color={colors.textTertiary} />
        <Text style={tabStyles.emptyTitle}>Aucun paiement</Text>
        <Text style={tabStyles.emptySub}>Aucune transaction enregistrée pour ce client</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16, paddingBottom: 32 }}>
      {/* Résumé */}
      <View style={tabStyles.paiResume}>
        <View style={[tabStyles.paiResumeCard, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#15803D" />
          <View>
            <Text style={[tabStyles.paiResumeVal, { color: '#15803D' }]}>{formatMontant(totalPaye)}</Text>
            <Text style={tabStyles.paiResumeLbl}>Encaissé</Text>
          </View>
        </View>
        <View style={[tabStyles.paiResumeCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="time" size={20} color="#D97706" />
          <View>
            <Text style={[tabStyles.paiResumeVal, { color: '#D97706' }]}>{formatMontant(totalAttente)}</Text>
            <Text style={tabStyles.paiResumeLbl}>En attente</Text>
          </View>
        </View>
      </View>

      {paiements.map((p) => {
        const svc = services.find(s => s.id === p.serviceId);
        return (
          <View key={p.id} style={[tabStyles.paiCard, shadows.sm]}>
            <View style={tabStyles.paiTop}>
              <View style={{ flex: 1 }}>
                <Text style={tabStyles.paiDesc} numberOfLines={1}>
                  {p.description || svc?.nom || 'Paiement'}
                </Text>
                {svc && <Text style={tabStyles.paiService}>{svc.nom}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={tabStyles.paiMontant}>{formatMontant(p.montant)}</Text>
                <PaiementBadge statut={p.statut} />
              </View>
            </View>
            <View style={tabStyles.paiBottom}>
              <View style={tabStyles.paiTag}>
                <Ionicons name="calendar-outline" size={11} color={colors.textSecondary} />
                <Text style={tabStyles.paiTagTxt}>{formatDate(p.datePaiement)}</Text>
              </View>
              <View style={tabStyles.paiTag}>
                <Ionicons name="card-outline" size={11} color={colors.textSecondary} />
                <Text style={tabStyles.paiTagTxt}>{p.modePaiement}</Text>
              </View>
              {p.reference && (
                <View style={tabStyles.paiTag}>
                  <Text style={tabStyles.paiTagTxt}>{p.reference}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, color: colors.textSecondary },
  backLink: { marginTop: 16 },
  backLinkTxt: { color: colors.primary, fontSize: 14, fontWeight: '600' },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 6,
  },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  navActions: { flexDirection: 'row' },

  hero: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 14 },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.accent },
  heroAvatarTxt: { fontSize: 24, fontWeight: '800' },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  heroSecteur: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  heroSecteurTxt: { fontSize: 12, color: colors.accentLight, fontWeight: '500' },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  actionBtns: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionBtnTxt: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  actionCall: { backgroundColor: '#16A34A' },
  actionWhatsApp: { backgroundColor: '#25D366' },
  actionEmail: { backgroundColor: '#1D4ED8' },

  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 4, paddingBottom: 0 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.accent },
  tabTxt: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTxtActive: { color: '#FFFFFF', fontWeight: '700' },

  scroll: { flex: 1 },
  modal: { flex: 1, backgroundColor: '#F7F8FC' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBody: { flex: 1, padding: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.md, borderWidth: 1,
    borderColor: '#E5E7EB', padding: 12, fontSize: 14, color: colors.text,
  },
  inputMulti: { height: 90, textAlignVertical: 'top' },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6',
    marginRight: 8, borderWidth: 1, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  chipTxt: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  chipTxtActive: { color: colors.primaryDark },
  statutRow: { flexDirection: 'row', gap: 8 },
  statutBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: borderRadius.md,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  statutTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: 16,
    alignItems: 'center', marginTop: 24, marginBottom: 40,
  },
  saveBtnTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

const tabStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', margin: 16, marginBottom: 0, borderRadius: borderRadius.lg, padding: 16 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  rowVal: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 1 },
  rowEmpty: { fontSize: 13, color: colors.textTertiary, fontStyle: 'italic' },
  secteurBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryTint,
    borderRadius: borderRadius.md, padding: 12,
  },
  secteurTxt: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  notesBox: { backgroundColor: '#F9FAFB', borderRadius: borderRadius.md, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.primary },
  notesTxt: { fontSize: 14, color: colors.text, lineHeight: 22 },
  dateTxt: { textAlign: 'center', fontSize: 11, color: colors.textTertiary, marginTop: 20, marginBottom: 8 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  timelineTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  timelineLine: { alignItems: 'center', width: 28 },
  timelineDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  timelineConnector: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: 4 },
  timelineCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: borderRadius.md, padding: 12 },
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timelineType: {},
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  typeBadgeTxt: { fontSize: 11, fontWeight: '700' },
  timelineDate: { fontSize: 11, color: colors.textSecondary },
  timelineTitle2: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  timelineSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  timelineMontant: { fontSize: 15, fontWeight: '800', color: colors.text },
  rdvStatutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  rdvStatutTxt: { fontSize: 11, fontWeight: '700' },

  paiResume: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  paiResumeCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: borderRadius.md, padding: 12 },
  paiResumeVal: { fontSize: 14, fontWeight: '800' },
  paiResumeLbl: { fontSize: 11, color: colors.textSecondary },
  paiCard: { backgroundColor: '#FFFFFF', borderRadius: borderRadius.md, padding: 14, marginBottom: 10 },
  paiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  paiDesc: { fontSize: 14, fontWeight: '700', color: colors.text },
  paiService: { fontSize: 11, color: colors.primary, marginTop: 2, fontWeight: '600' },
  paiMontant: { fontSize: 15, fontWeight: '800', color: colors.text },
  paiBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  paiTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  paiTagTxt: { fontSize: 11, color: colors.textSecondary },
});
