import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Linking, Modal, FlatList, StatusBar
} from 'react-native';

// ─── Données de démonstration ───────────────────────────────────────────────
const CLIENTS_DATA = [
  {
    id: '1',
    nom: 'SONATRAC Congo',
    contact: 'Jean-Pierre Moukala',
    telephone: '+242 06 123 4567',
    email: 'jp.moukala@sonatrac.cg',
    adresse: 'Avenue de l\'Indépendance, Brazzaville',
    secteur: 'Énergie & Pétrole',
    statut: 'actif',
    chiffre: '450 000 FCFA',
    interventions: [
      { date: '15 mars 2026', type: 'Maintenance industrielle', statut: 'Terminée' },
      { date: '02 fév 2026', type: 'IT / Réseaux', statut: 'Terminée' },
    ],
  },
  {
    id: '2',
    nom: 'Groupe BTP Niari',
    contact: 'Marie Louzolo',
    telephone: '+242 05 987 6543',
    email: 'm.louzolo@btpniari.cg',
    adresse: 'Rue Loubomo, Pointe-Noire',
    secteur: 'BTP & Construction',
    statut: 'actif',
    chiffre: '320 000 FCFA',
    interventions: [
      { date: '20 mars 2026', type: 'Transport / Logistique', statut: 'En cours' },
      { date: '10 jan 2026', type: 'Consulting', statut: 'Terminée' },
    ],
  },
  {
    id: '3',
    nom: 'Clinique Sainte-Marie',
    contact: 'Dr. Alphonse Ngoma',
    telephone: '+242 06 555 7890',
    email: 'a.ngoma@clinique-sm.cg',
    adresse: 'Boulevard Lyautey, Brazzaville',
    secteur: 'Santé',
    statut: 'en_attente',
    chiffre: '175 000 FCFA',
    interventions: [
      { date: '25 mars 2026', type: 'Surveillance', statut: 'En attente' },
    ],
  },
  {
    id: '4',
    nom: 'Hôtel Grand Congo',
    contact: 'Sophie Bouanga',
    telephone: '+242 05 333 2211',
    email: 's.bouanga@grandcongo.cg',
    adresse: 'Avenue Foch, Brazzaville',
    secteur: 'Hôtellerie & Tourisme',
    statut: 'prospect',
    chiffre: '0 FCFA',
    interventions: [],
  },
];

const STATUT_CONFIG = {
  actif:      { label: 'Actif',      bg: '#E8F5E9', color: '#2E7D32' },
  en_attente: { label: 'En attente', bg: '#FFF3E0', color: '#E65100' },
  inactif:    { label: 'Inactif',    bg: '#FFEBEE', color: '#C62828' },
  prospect:   { label: 'Prospect',   bg: '#E3F2FD', color: '#1565C0' },
};

const INTERVENTION_STATUT = {
  'Terminée':   { bg: '#E8F5E9', color: '#2E7D32' },
  'En cours':   { bg: '#E3F2FD', color: '#1565C0' },
  'En attente': { bg: '#FFF3E0', color: '#E65100' },
};

// ─── Composant principal ─────────────────────────────────────────────────────
export default function ClientsPage() {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [clientSelectionne, setClientSelectionne] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const clientsFiltres = CLIENTS_DATA.filter(c => {
    const matchRecherche =
      c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      c.contact.toLowerCase().includes(recherche.toLowerCase()) ||
      c.secteur.toLowerCase().includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut;
    return matchRecherche && matchStatut;
  });

  const ouvrirFiche = (client) => {
    setClientSelectionne(client);
    setModalVisible(true);
  };

  const appeler = (tel) => Linking.openURL(`tel:${tel}`);
  const whatsapp = (tel) => {
    const numero = tel.replace(/\s/g, '').replace('+', '');
    Linking.openURL(`https://api.whatsapp.com/send?phone=${numero}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#001F3F" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Clients</Text>
          <Text style={styles.headerSub}>{clientsFiltres.length} client(s) trouvé(s)</Text>
        </View>
        <TouchableOpacity style={styles.btnAjouter}>
          <Text style={styles.btnAjouterTexte}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un client..."
          placeholderTextColor="#90A4AE"
          value={recherche}
          onChangeText={setRecherche}
        />
      </View>

      {/* Filtres statut */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtresScroll}>
        {['tous', 'actif', 'en_attente', 'prospect', 'inactif'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filtreBadge, filtreStatut === f && styles.filtreBadgeActif]}
            onPress={() => setFiltreStatut(f)}
          >
            <Text style={[styles.filtreTexte, filtreStatut === f && styles.filtreTexteActif]}>
              {f === 'tous' ? 'Tous' : STATUT_CONFIG[f]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste clients */}
      <FlatList
        data={clientsFiltres}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.liste}
        renderItem={({ item }) => {
          const statut = STATUT_CONFIG[item.statut];
          return (
            <TouchableOpacity style={styles.carteClient} onPress={() => ouvrirFiche(item)}>
              <View style={styles.carteHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexte}>{item.nom[0]}</Text>
                </View>
                <View style={styles.carteInfo}>
                  <Text style={styles.carteNom}>{item.nom}</Text>
                  <Text style={styles.carteContact}>{item.contact}</Text>
                  <Text style={styles.carteSecteur}>{item.secteur}</Text>
                </View>
                <View style={[styles.statutBadge, { backgroundColor: statut.bg }]}>
                  <Text style={[styles.statutTexte, { color: statut.color }]}>{statut.label}</Text>
                </View>
              </View>
              <View style={styles.carteDivider} />
              <View style={styles.carteFooter}>
                <Text style={styles.carteChiffre}>💰 {item.chiffre}</Text>
                <Text style={styles.carteInterventions}>
                  📋 {item.interventions.length} intervention(s)
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.vide}>
            <Text style={styles.videTexte}>Aucun client trouvé</Text>
          </View>
        }
      />

      {/* Modal fiche client */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        {clientSelectionne && (
          <View style={styles.modalContainer}>
            <StatusBar backgroundColor="#001F3F" barStyle="light-content" />

            {/* Header modal */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnRetour}>
                <Text style={styles.btnRetourTexte}>← Retour</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitre}>Fiche Client</Text>
              <View style={{ width: 70 }} />
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Identité */}
              <View style={styles.ficheSection}>
                <View style={styles.ficheAvatarGrand}>
                  <Text style={styles.ficheAvatarTexte}>{clientSelectionne.nom[0]}</Text>
                </View>
                <Text style={styles.ficheNom}>{clientSelectionne.nom}</Text>
                <Text style={styles.ficheContact}>{clientSelectionne.contact}</Text>
                <View style={[
                  styles.statutBadge,
                  { backgroundColor: STATUT_CONFIG[clientSelectionne.statut].bg, alignSelf: 'center', marginTop: 8 }
                ]}>
                  <Text style={[styles.statutTexte, { color: STATUT_CONFIG[clientSelectionne.statut].color }]}>
                    {STATUT_CONFIG[clientSelectionne.statut].label}
                  </Text>
                </View>
              </View>

              {/* Boutons action */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.btnAction, { backgroundColor: '#001F3F' }]}
                  onPress={() => appeler(clientSelectionne.telephone)}
                >
                  <Text style={styles.btnActionTexte}>📞 Appeler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnAction, { backgroundColor: '#25D366' }]}
                  onPress={() => whatsapp(clientSelectionne.telephone)}
                >
                  <Text style={styles.btnActionTexte}>💬 WhatsApp</Text>
                </TouchableOpacity>
              </View>

              {/* Informations */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitre}>📋 Informations</Text>
                <InfoLigne label="Téléphone" valeur={clientSelectionne.telephone} />
                <InfoLigne label="Email" valeur={clientSelectionne.email} />
                <InfoLigne label="Adresse" valeur={clientSelectionne.adresse} />
                <InfoLigne label="Secteur" valeur={clientSelectionne.secteur} />
                <InfoLigne label="Chiffre d'affaires" valeur={clientSelectionne.chiffre} />
              </View>

              {/* Historique interventions */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitre}>🔧 Historique des interventions</Text>
                {clientSelectionne.interventions.length === 0 ? (
                  <Text style={styles.aucuneIntervention}>Aucune intervention enregistrée</Text>
                ) : (
                  clientSelectionne.interventions.map((int, idx) => {
                    const config = INTERVENTION_STATUT[int.statut] || { bg: '#F5F5F5', color: '#555' };
                    return (
                      <View key={idx} style={styles.interventionItem}>
                        <View style={styles.interventionInfo}>
                          <Text style={styles.interventionType}>{int.type}</Text>
                          <Text style={styles.interventionDate}>{int.date}</Text>
                        </View>
                        <View style={[styles.statutBadge, { backgroundColor: config.bg }]}>
                          <Text style={[styles.statutTexte, { color: config.color }]}>{int.statut}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

// ─── Composant utilitaire ────────────────────────────────────────────────────
function InfoLigne({ label, valeur }) {
  return (
    <View style={styles.infoLigne}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValeur}>{valeur}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F4F6F9' },

  // Header
  header:           { backgroundColor: '#001F3F', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:      { color: '#FFC107', fontSize: 24, fontWeight: 'bold' },
  headerSub:        { color: '#90CAF9', fontSize: 13, marginTop: 2 },
  btnAjouter:       { backgroundColor: '#FFC107', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  btnAjouterTexte:  { color: '#001F3F', fontWeight: 'bold', fontSize: 13 },

  // Recherche
  searchContainer:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 12, elevation: 2 },
  searchIcon:       { fontSize: 16, marginRight: 8 },
  searchInput:      { flex: 1, height: 44, fontSize: 15, color: '#263238' },

  // Filtres
  filtresScroll:    { paddingLeft: 16, marginBottom: 8, flexGrow: 0 },
  filtreBadge:      { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E0E0E0', marginRight: 8 },
  filtreBadgeActif: { backgroundColor: '#001F3F' },
  filtreTexte:      { color: '#555', fontSize: 13, fontWeight: '500' },
  filtreTexteActif: { color: '#FFC107' },

  // Liste
  liste:            { paddingHorizontal: 16, paddingBottom: 20 },
  carteClient:      { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, padding: 16, elevation: 2 },
  carteHeader:      { flexDirection: 'row', alignItems: 'center' },
  avatar:           { width: 46, height: 46, borderRadius: 23, backgroundColor: '#001F3F', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTexte:      { color: '#FFC107', fontSize: 20, fontWeight: 'bold' },
  carteInfo:        { flex: 1 },
  carteNom:         { fontSize: 15, fontWeight: 'bold', color: '#001F3F' },
  carteContact:     { fontSize: 13, color: '#546E7A', marginTop: 1 },
  carteSecteur:     { fontSize: 12, color: '#90A4AE', marginTop: 1 },
  statutBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statutTexte:      { fontSize: 11, fontWeight: 'bold' },
  carteDivider:     { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  carteFooter:      { flexDirection: 'row', justifyContent: 'space-between' },
  carteChiffre:     { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  carteInterventions: { fontSize: 13, color: '#546E7A' },

  // Vide
  vide:             { alignItems: 'center', marginTop: 60 },
  videTexte:        { color: '#90A4AE', fontSize: 16 },

  // Modal
  modalContainer:   { flex: 1, backgroundColor: '#F4F6F9' },
  modalHeader:      { backgroundColor: '#001F3F', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  btnRetour:        { width: 70 },
  btnRetourTexte:   { color: '#FFC107', fontSize: 14 },
  modalTitre:       { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalScroll:      { flex: 1 },

  // Fiche
  ficheSection:     { alignItems: 'center', backgroundColor: '#fff', padding: 24, marginBottom: 12 },
  ficheAvatarGrand: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#001F3F', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  ficheAvatarTexte: { color: '#FFC107', fontSize: 36, fontWeight: 'bold' },
  ficheNom:         { fontSize: 22, fontWeight: 'bold', color: '#001F3F', textAlign: 'center' },
  ficheContact:     { fontSize: 15, color: '#546E7A', marginTop: 4 },

  // Actions
  actionsRow:       { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 12 },
  btnAction:        { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnActionTexte:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Info card
  infoCard:         { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16 },
  infoCardTitre:    { fontSize: 15, fontWeight: 'bold', color: '#001F3F', marginBottom: 12 },
  infoLigne:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  infoLabel:        { fontSize: 13, color: '#90A4AE', flex: 1 },
  infoValeur:       { fontSize: 13, color: '#263238', fontWeight: '500', flex: 2, textAlign: 'right' },

  // Interventions
  interventionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  interventionInfo: { flex: 1 },
  interventionType: { fontSize: 13, fontWeight: '600', color: '#263238' },
  interventionDate: { fontSize: 12, color: '#90A4AE', marginTop: 2 },
  aucuneIntervention: { color: '#90A4AE', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});
