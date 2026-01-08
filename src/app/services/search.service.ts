import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private searchIndex: any[] = [];

  constructor(private router: Router) {
    this.buildSearchIndex();
  }

  private buildSearchIndex(): void {
    // Ajout manuel de toutes les pages avec leurs métadonnées
    this.searchIndex = [
      {
        title: 'Tableau de bord Gérant',
        description: 'Tableau de bord principal pour les gérants',
        path: '/dashboard-gerant',
        icon: 'bi-speedometer2',
        keywords: ['dashboard', 'accueil', 'principal'],
      },
      {
        title: 'Tableau de bord Co-gérant',
        description: 'Tableau de bord principal pour les co-gérants',
        path: '/dashboard-cogerant',
        icon: 'bi-speedometer2',
        keywords: ['dashboard', 'accueil', 'principal'],
      },
      {
        title: 'Tableau de bord Pompiste',
        description: 'Tableau de bord principal pour les pompistes',
        path: '/dashboard-pompiste',
        icon: 'bi-speedometer2',
        keywords: ['dashboard', 'accueil', 'principal', 'calendrier', 'planning'],
      },
      {
        title: 'Tableau de bord Caissier',
        description: 'Tableau de bord principal pour les caissiers',
        path: '/dashboard-caissier',
        icon: 'bi-speedometer2',
        keywords: ['dashboard', 'accueil', 'principal', 'activité', 'ventes'],
      },
      {
        title: 'Tableau de bord Client',
        description: 'Tableau de bord principal pour les clients',
        path: '/dashboard-client',
        icon: 'bi-speedometer2',
        keywords: ['dashboard', 'accueil', 'principal'],
      },
      {
        title: 'Mon Profil',
        description: 'Modifier votre profil utilisateur',
        path: '/profile-utilisateur',
        icon: 'bi-person',
        keywords: [
          'profil',
          'compte',
          'password',
          'photo',
          'permissions',
          'paramètres',
        ],
      },
      {
        title: 'Documentation',
        description: 'Accéder à la documentation du système',
        path: '/documentation',
        icon: 'bi-book',
        keywords: ['aide', 'manuel', 'support'],
      },
      {
        title: 'Envoyer Réclamation',
        description: 'Envoyer une nouvelle réclamation',
        path: '/envoyer-reclamation',
        icon: 'bi-exclamation-circle',
        keywords: ['réclamation', 'problème', 'aide'],
      },
      {
        title: 'Traiter Réclamations',
        description: 'Gérer les réclamations reçues',
        path: '/traiter-reclamations',
        icon: 'bi-gear',
        keywords: ['réclamation', 'traitement', 'résolution'],
      },
      {
        title: 'Gestion Utilisateurs',
        description: 'Gérer les utilisateurs du système',
        path: '/gestion-utilisateurs',
        icon: 'bi-people',
        keywords: ['utilisateurs', 'comptes', 'gestion'],
      },
      {
        title: 'Ajouter Utilisateur',
        description: 'Créer un nouveau compte utilisateur',
        path: '/ajouter-utilisateur',
        icon: 'bi-person-plus',
        keywords: ['nouveau', 'utilisateur', 'création'],
      },
      {
        title: 'Gestion Affectations Pompistes',
        description: 'Gérer les affectations des pompistes',
        path: '/gestion-affectations-pompistes',
        icon: 'bi-person-lines-fill',
        keywords: ['affectation', 'pompiste', 'planning'],
      },
      {
        title: 'Liste Pompes',
        description: 'Voir et gérer les pompes disponibles',
        path: '/liste-pompes',
        icon: 'bi-fuel-pump',
        keywords: ['pompe', 'pistolet', 'station'],
      },
      {
        title: 'Ajouter Pompe',
        description: 'Ajouter une nouvelle pompe',
        path: '/ajouter-pompe',
        icon: 'bi-plus-circle',
        keywords: ['nouvelle', 'pompe', 'ajout', 'pistolet'],
      },
      {
        title: 'Gestion Crédits',
        description: 'Gérer les crédits clients',
        path: '/gestion-credits',
        icon: 'bi-credit-card',
        keywords: ['crédit', 'client', 'dette', 'renouvellement'],
      },
      {
        title: 'Gestion Véhicules',
        description: 'Gérer les véhicules enregistrés',
        path: '/gestion-vehicules',
        icon: 'bi-truck',
        keywords: ['véhicule', 'voiture', 'immatriculation', 'renouvellement'],
      },
      {
        title: 'Gestion Transactions',
        description: 'Historique des transactions',
        path: '/gestion-transactions',
        icon: 'bi-cash-stack',
        keywords: ['transaction', 'historique', 'preuve'],
      },
      {
        title: 'Liste Paiements',
        description: 'Historique des paiements',
        path: '/liste-paiements',
        icon: 'bi-receipt',
        keywords: ['paiement', 'historique', 'facture', 'reference'],
      },
      {
        title: 'Saisie Crédit',
        description: 'Enregistrer une vente à crédit',
        path: '/saisie-credit',
        icon: 'bi-wallet2',
        keywords: ['vente', 'crédit', 'enregistrement', 'qrcode'],
      },
      {
        title: 'Saisie Index',
        description: 'Saisie des index de fermeture',
        path: '/saisie-index',
        icon: 'bi-clipboard-data',
        keywords: ['index', 'fermeture', 'compteur', 'ouvreture'],
      },
      {
        title: 'Saisie Paiement',
        description: 'Enregistrer un paiement',
        path: '/saisie-paiement',
        icon: 'bi-cash',
        keywords: ['paiement', 'encaissement', 'enregistrement'],
      },
      {
        title: 'Gestion Stock',
        description: 'Gérer le stock de carburant',
        path: '/gestion-stock',
        icon: 'bi-boxes',
        keywords: [
          'stock',
          'inventaire',
          'produit',
          'categorie',
          'mouvement',
          'vente',
          'barcode',
        ],
      },
      {
        title: 'Ajouter Vente',
        description: 'Point de vente',
        path: '/ajouter-vente',
        icon: 'bi-cart-plus',
        keywords: ['vente', 'point', 'barcode', 'produit', 'monnaie', 'recu'],
      },
      {
        title: 'Visualiser Revenus',
        description: 'Visualiser les revenus',
        path: '/visualiser-revenues',
        icon: 'bi-graph-up',
        keywords: [
          'revenu',
          'statistique',
          'analyse',
          'releve',
          'rapport',
          'recette',
          'caisse',
        ],
      },
      {
        title: "Page d'accueil",
        description: 'Retour à la page principale',
        path: '/index',
        icon: 'bi-house',
        keywords: ['accueil', 'principal', 'dashboard'],
      },
      {
        title: 'Déconnexion',
        description: 'Se déconnecter du système',
        path: '/logout',
        icon: 'bi-box-arrow-right',
        keywords: ['logout', 'signout', 'quitter'],
      },
    ];
  }

  search(query: string): any[] {
    if (!query || query.length < 2) return [];

    const q = query.toLowerCase();
    return this.searchIndex
      .filter(item => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords.some((k: string) => k.toLowerCase().includes(q))
        );
      })
      .slice(0, 10); // Limiter à 10 résultats
  }
}
