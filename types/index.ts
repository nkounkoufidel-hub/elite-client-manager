export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  statut: 'actif' | 'inactif' | 'prospect';
  notes?: string;
  secteurActivite?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  nom: string;
  description?: string;
  prix: number;
  duree?: string;
  categorie?: string;
  actif?: number | string;
  createdAt?: string;
}

export interface Paiement {
  id: string;
  clientId: string;
  serviceId?: string;
  montant: number;
  statut: 'paye' | 'en_attente' | 'partiellement_paye' | 'annule';
  modePaiement?: string;
  reference?: string;
  description?: string;
  datePaiement?: string;
  createdAt?: string;
}

export interface RendezVous {
  id: string;
  clientId: string;
  serviceId?: string;
  titre: string;
  description?: string;
  dateHeure: string;
  dureeMinutes?: number;
  statut: 'planifie' | 'confirme' | 'annule' | 'termine';
  createdAt?: string;
}
