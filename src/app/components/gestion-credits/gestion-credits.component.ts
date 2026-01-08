import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GestionCreditsService } from '../../services/gestion-credits.service';

@Component({
  selector: 'app-gestion-credits',
  standalone: true,
  imports: [
    NavbarComponent,
    SidebarComponent,
    CommonModule,
    FooterComponent,
    FormsModule,
    HttpClientModule,
    RouterModule,
  ],
  templateUrl: './gestion-credits.component.html',
  styleUrls: ['./gestion-credits.component.css'],
})
export class GestionCreditsComponent implements OnInit {
  credits: any[] = [];
  filteredCredits: any[] = [];
  searchTerm: string = '';
  selectedType: string = '';
  selectedEtat: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  isLoading: boolean = false;

  // Variables pour les modals
  selectedCredit: any = {};
  isModalOpen: boolean = false;
  isRenewModalOpen: boolean = false;
  errorMessage: string = '';

  // Nouvelles propriétés pour les modals modernes
  showDetailsModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  successMessage: string = '';
  errorModalMessage: string = '';
  creditToRenew: any = {};

  // Variables pour l'autocomplétion
  clients: any[] = [];
  filteredClients: any[] = [];
  showClientDropdown: boolean = false;
  clientSearchTerm: string = '';

  constructor(private gestionCreditsService: GestionCreditsService) {}

  ngOnInit(): void {
    this.fetchCredits();
    this.fetchClients();
  }

  fetchClients(): void {
    this.gestionCreditsService.getAllUsers().subscribe(
      (data: any) => {
        this.clients = data.filter((user: any) => user.role === 'client');
      },
      error => {
        console.error('Erreur lors du chargement des clients', error);
      }
    );
  }

  fetchCredits(): void {
    this.isLoading = true;
    this.gestionCreditsService.getAllCredits().subscribe(
      data => {
        this.credits = data;
        this.totalPages = Math.ceil(this.credits.length / this.pageSize);
        this.updateFilteredCredits();
        this.isLoading = false;
      },
      error => {
        console.error('Erreur lors du chargement des crédits', error);
        this.isLoading = false;
      }
    );
  }

  updateFilteredCredits(): void {
    this.filteredCredits = this.credits
      .filter(credit => {
        const matchesSearchTerm =
          this.searchTerm === '' ||
          credit.utilisateur.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          credit.id === parseInt(this.searchTerm);
        const matchesType =
          this.selectedType === '' || credit.type_credit === this.selectedType;
        const matchesEtat =
          this.selectedEtat === '' || credit.etat === this.selectedEtat;
        return matchesSearchTerm && matchesType && matchesEtat;
      })
      .slice(
        (this.currentPage - 1) * this.pageSize,
        this.currentPage * this.pageSize
      );
  }

  filterCredits(): void {
    this.currentPage = 1;
    this.updateFilteredCredits();
  }

  // Gestion de l'autocomplétion des clients
  filterClientList(event: any): void {
    this.clientSearchTerm = event.target.value;
    if (this.clientSearchTerm.length > 0) {
      this.filteredClients = this.clients.filter(client =>
        client.username.toLowerCase().includes(this.clientSearchTerm.toLowerCase())
      );
      this.showClientDropdown = this.filteredClients.length > 0;
    } else {
      this.filteredClients = [];
      this.showClientDropdown = false;
    }
  }
  selectClient(client: any): void {
    this.selectedCredit.utilisateur = client.username;
    this.clientSearchTerm = client.username;
    this.showClientDropdown = false;
    this.errorMessage = ''; // Nettoyer les erreurs précédentes
  }
  // Modal d'ajout
  openAddModal(): void {
    this.selectedCredit = {
      date_debut: new Date().toISOString().split('T')[0], // Date du jour par défaut
      type_credit: '',
      solde_credit: '',
      duree_credit: '',
      utilisateur: '',
    };
    this.clientSearchTerm = '';
    this.filteredClients = [];
    this.showClientDropdown = false;
    this.isModalOpen = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.errorMessage = '';
    this.clientSearchTerm = '';
    this.filteredClients = [];
    this.showClientDropdown = false;
  }

  // Modal de renouvellement
  openRenewModal(credit: any): void {
    if (credit.etat !== 'remboursé' && credit.etat !== 'expiré') {
      this.showErrorModal = true;
      this.errorModalMessage =
        'Seuls les crédits remboursés ou expirés peuvent être renouvelés';
      return;
    }

    this.creditToRenew = {
      id: credit.id,
      utilisateur: credit.utilisateur,
      type_credit: credit.type_credit,
      solde_credit: credit.solde_credit,
      duree_credit: credit.duree_credit,
      date_debut: new Date().toISOString().split('T')[0], // Date du jour par défaut
    };
    this.isRenewModalOpen = true;
    this.showDetailsModal = false; // Fermer le modal détails si ouvert
  }
  closeRenewModal(): void {
    this.isRenewModalOpen = false;
    this.errorMessage = '';
  }

  // Nouvelles méthodes pour les modals modernes
  showCreditDetails(credit: any): void {
    this.selectedCredit = { ...credit };
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCredit = {};
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
  }
  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorModalMessage = '';
  }
  // Méthode pour gérer les clics sur l'overlay des modaux (comme gestion-utilisateurs)
  onModalOverlayClick(event: Event): void {
    // Ne pas fermer le modal si on clique sur le contenu du modal
    event.stopPropagation();
  }
  addCredit(): void {
    // Vérifications de base
    if (
      !this.clientSearchTerm ||
      !this.selectedCredit.type_credit ||
      !this.selectedCredit.solde_credit ||
      !this.selectedCredit.date_debut ||
      !this.selectedCredit.duree_credit
    ) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    // Vérifier que le nom du client correspond à un client existant
    const selectedClient = this.clients.find(
      c => c.username === this.clientSearchTerm
    );
    if (!selectedClient) {
      this.errorMessage = 'Veuillez sélectionner un client valide dans la liste';
      return;
    }

    // Vérifier que les valeurs numériques sont valides
    if (
      isNaN(parseFloat(this.selectedCredit.solde_credit)) ||
      parseFloat(this.selectedCredit.solde_credit) <= 0
    ) {
      this.errorMessage = 'Le solde du crédit doit être un nombre positif';
      return;
    }

    if (
      isNaN(parseInt(this.selectedCredit.duree_credit)) ||
      parseInt(this.selectedCredit.duree_credit) <= 0
    ) {
      this.errorMessage = 'La durée du crédit doit être un nombre entier positif';
      return;
    } // Préparer les données du crédit - le backend trouve l'ID automatiquement avec le username
    const creditData = {
      utilisateur: this.clientSearchTerm, // Envoyer le nom d'utilisateur, le backend trouve l'ID automatiquement
      type_credit: this.selectedCredit.type_credit,
      solde_credit: parseFloat(this.selectedCredit.solde_credit),
      date_debut: this.selectedCredit.date_debut,
      duree_credit: parseInt(this.selectedCredit.duree_credit),
    };

    console.log('Données crédit à envoyer:', creditData);

    this.gestionCreditsService.addCredit(creditData).subscribe(
      response => {
        console.log('Crédit ajouté avec succès', response);
        this.fetchCredits();
        this.closeModal();
        this.showSuccessModal = true;
        this.successMessage = 'Crédit ajouté avec succès !';
      },
      error => {
        console.error("Erreur lors de l'ajout du crédit", error);
        if (error.status === 404) {
          this.errorMessage = 'Client non trouvé.';
        } else if (error.status === 400) {
          this.showErrorModal = true;
          this.errorModalMessage =
            error.error?.message ||
            'Toutes les informations sont requises pour créer le crédit.';
        } else {
          this.showErrorModal = true;
          this.errorModalMessage =
            "Une erreur s'est produite lors de l'ajout du crédit.";
        }
      }
    );
  }
  renewCredit(): void {
    // Vérifications de base
    if (!this.creditToRenew.solde_credit || !this.creditToRenew.duree_credit) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    // Vérifier que les valeurs numériques sont valides
    if (
      isNaN(parseFloat(this.creditToRenew.solde_credit)) ||
      parseFloat(this.creditToRenew.solde_credit) <= 0
    ) {
      this.errorMessage = 'Le nouveau solde du crédit doit être un nombre positif';
      return;
    }

    if (
      isNaN(parseInt(this.creditToRenew.duree_credit)) ||
      parseInt(this.creditToRenew.duree_credit) <= 0
    ) {
      this.errorMessage =
        'La nouvelle durée du crédit doit être un nombre entier positif';
      return;
    }

    const renewData = {
      id_credit: this.creditToRenew.id,
      type_credit: this.creditToRenew.type_credit,
      solde_credit: parseFloat(this.creditToRenew.solde_credit),
      date_debut: this.creditToRenew.date_debut,
      duree_credit: parseInt(this.creditToRenew.duree_credit),
    };

    console.log('Données de renouvellement à envoyer:', renewData);

    this.gestionCreditsService.renewCredit(renewData).subscribe(
      response => {
        console.log('Crédit renouvelé avec succès', response);
        this.fetchCredits();
        this.closeRenewModal();
        this.showSuccessModal = true;
        this.successMessage = 'Crédit renouvelé avec succès !';
      },
      error => {
        console.error('Erreur lors du renouvellement du crédit', error);
        this.showErrorModal = true;
        this.errorModalMessage =
          error.error?.error ||
          "Une erreur s'est produite lors du renouvellement du crédit.";
      }
    );
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateFilteredCredits();
    }
  }

  changePageSize(): void {
    const parsedSize = parseInt(this.pageSize.toString(), 10);
    if (!isNaN(parsedSize) && parsedSize > 0) {
      this.pageSize = parsedSize;
      this.totalPages = Math.ceil(this.credits.length / this.pageSize);
      this.currentPage = 1;
      this.updateFilteredCredits();
    }
  }

  // Méthodes pour les badges et icônes
  getBadgeClass(etat: string): string {
    switch (etat?.toLowerCase()) {
      case 'actif':
        return 'bg-success';
      case 'remboursé':
        return 'bg-primary';
      case 'annulé':
        return 'bg-secondary';
      case 'expiré':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getStatusIcon(etat: string): string {
    switch (etat?.toLowerCase()) {
      case 'actif':
        return 'bi bi-check-circle-fill';
      case 'remboursé':
        return 'bi bi-cash-coin';
      case 'annulé':
        return 'bi bi-x-circle-fill';
      case 'expiré':
        return 'bi bi-exclamation-triangle-fill';
      default:
        return 'bi bi-question-circle-fill';
    }
  }
}
