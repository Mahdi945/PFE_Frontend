import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionCreditsService } from '../../services/gestion-credits.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

interface Payment {
  id: number;
  id_credit: number;
  id_utilisateur: number;
  montant_paye: number;
  montant_restant: number;
  date_paiement: string;
  mode_paiement: 'especes' | 'carte' | 'virement' | 'cheque';
  reference_paiement: string;
  description?: string;
  username?: string;
  caissier_username: string;
}

interface Credit {
  id: number;
  id_utilisateur: number;
  type_credit: string;
  solde_credit: number;
  date_debut: string;
  duree_credit: number;
  credit_utilise?: number;
  etat: string;
  utilisateur?: string;
}

interface User {
  id: number;
  username: string;
}

@Component({
  selector: 'app-gestion-paiments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './gestion-paiments.component.html',
  styleUrls: ['./gestion-paiments.component.css'],
})
export class GestionPaimentsComponent implements OnInit {
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  credits: Credit[] = [];
  activeCredits: Credit[] = [];
  users: User[] = [];

  isLoading: boolean = false;
  isSaving: boolean = false;
  searchTerm: string = '';
  searchPaymentId: string = '';
  searchCreditId: string = '';
  selectedCredit: number | null = null;
  selectedUser: number | null = null;
  selectedMode: string = '';
  selectedDate: string | null = null;

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  totalPayed: number = 0;
  showAddModal: boolean = false;
  showDetailsModal: boolean = false;
  selectedPayment: Payment | null = null;
  selectedPaymentCredit: Credit | null = null;

  newPayment = {
    id_credit: null as number | null,
    montant_paye: null as number | null,
    mode_paiement: '' as 'especes' | 'carte' | 'virement' | 'cheque' | '',
    date_paiement: new Date().toISOString().slice(0, 16),
    description: '',
  };
  errorMessage: string = '';

  constructor(private creditService: GestionCreditsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.payments = [];
    this.filteredPayments = [];

    // Charger les crédits
    this.creditService.getAllCredits().subscribe({
      next: (credits: any) => {
        this.credits = Array.isArray(credits) ? credits : [];
        this.activeCredits = this.credits.filter((c: any) => c.etat === 'actif');
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des crédits', err);
        this.isLoading = false;
      },
    });

    // Charger tous les paiements
    this.creditService.getAllPayments().subscribe({
      next: (response: any) => {
        // Gestion de plusieurs formats de réponse
        let payments = [];

        if (Array.isArray(response)) {
          payments = response;
        } else if (response && Array.isArray(response.data)) {
          payments = response.data;
        }

        console.log('Paiements après transformation:', payments);

        this.payments = payments;
        this.filterPayments();
        this.isLoading = false;
      },
      error: err => {
        console.error('Erreur:', err);
        this.payments = [];
        this.filteredPayments = [];
        this.isLoading = false;
      },
    });

    /// Modifiez la partie chargement des utilisateurs comme suit :
    this.creditService.getAllUsers().subscribe({
      next: (users: any) => {
        // Filtrer pour ne garder que les utilisateurs avec rôle 'client'
        this.users = Array.isArray(users)
          ? users.filter(user => user.role === 'client')
          : [];

        console.log('Clients chargés:', this.users); // Pour vérification
      },
      error: (err: any) =>
        console.error('Erreur lors du chargement des utilisateurs', err),
    });
  }
  filterPayments(): void {
    try {
      let results = [...this.payments];

      // Filtre par terme de recherche (nom client uniquement)
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        results = results.filter(
          p => p.username?.toLowerCase().includes(term) ?? false
        );
      }

      // Filtre par ID paiement
      if (this.searchPaymentId) {
        const paymentId = this.searchPaymentId.toLowerCase();
        results = results.filter(
          p =>
            p.id.toString().includes(paymentId) ||
            (p.reference_paiement?.toLowerCase().includes(paymentId) ?? false)
        );
      }

      // Filtre par ID crédit
      if (this.searchCreditId) {
        const creditId = this.searchCreditId.toLowerCase();
        results = results.filter(p => p.id_credit.toString().includes(creditId));
      }

      if (this.selectedCredit) {
        results = results.filter(p => p.id_credit === this.selectedCredit);
      }

      if (this.selectedUser) {
        results = results.filter(p => p.id_utilisateur === this.selectedUser);
      }

      if (this.selectedMode) {
        results = results.filter(p => p.mode_paiement === this.selectedMode);
      }

      if (this.selectedDate) {
        const selectedDate = new Date(this.selectedDate).toDateString();
        results = results.filter(
          p => new Date(p.date_paiement).toDateString() === selectedDate
        );
      }

      this.filteredPayments = results;
      this.totalPayed = this.filteredPayments.reduce(
        (sum, p) => sum + (p.montant_paye || 0),
        0
      );
      this.totalPages = Math.ceil(this.filteredPayments.length / this.pageSize);
      this.currentPage = 1;
    } catch (error) {
      console.error('Erreur lors du filtrage des paiements:', error);
      this.filteredPayments = [];
    }
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.errorMessage = '';
    this.newPayment = {
      id_credit: null,
      montant_paye: null,
      mode_paiement: '',
      date_paiement: new Date().toISOString().slice(0, 16),
      description: '',
    };
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitPayment(): void {
    if (
      !this.newPayment.id_credit ||
      !this.newPayment.montant_paye ||
      !this.newPayment.mode_paiement
    ) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const paymentData = {
      id_credit: this.newPayment.id_credit,
      montant_paye: this.newPayment.montant_paye,
      mode_paiement: this.newPayment.mode_paiement,
      description: this.newPayment.description,
      date_paiement: this.newPayment.date_paiement,
    };

    this.creditService.createPayment(paymentData).subscribe({
      next: () => {
        this.loadData();
        this.closeAddModal();
        this.isSaving = false;
      },
      error: (err: any) => {
        this.errorMessage =
          err.error?.message || "Une erreur est survenue lors de l'enregistrement";
        this.isSaving = false;
      },
    });
  }
  // Nouvelle méthode pour déterminer dynamiquement les données à exporter
  exportToExcel(): void {
    // Si des filtres sont actifs, exporter les paiements filtrés, sinon tout exporter
    const hasFilters =
      this.searchTerm ||
      this.selectedCredit ||
      this.selectedUser ||
      this.selectedMode ||
      this.selectedDate;

    const dataToExport = hasFilters ? this.filteredPayments : this.payments;

    if (dataToExport.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const data = dataToExport.map(p => ({
      Référence: p.reference_paiement,
      Crédit: `Crédit #${p.id_credit}`,
      Client: p.username || 'Inconnu',
      Montant: p.montant_paye,
      Reste: p.montant_restant,
      Date: new Date(p.date_paiement).toLocaleString(),
      Mode: this.getPaymentModeLabel(p.mode_paiement),
      Description: p.description || '',
      Pompiste: p.caissier_username || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paiements');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const fileName = hasFilters ? 'paiements_filtres' : 'tous_les_paiements';
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(data, `${fileName}_${new Date().getTime()}.xlsx`);
  }
  public getPaymentModeLabel(mode: string): string {
    switch (mode) {
      case 'especes':
        return 'Espèces';
      case 'carte':
        return 'Carte bancaire';
      case 'virement':
        return 'Virement';
      case 'cheque':
        return 'Chèque';
      default:
        return mode;
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPages(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
  viewDetails(payment: Payment): void {
    this.selectedPayment = payment;

    // Chercher le crédit associé
    this.selectedPaymentCredit =
      this.credits.find(c => c.id === payment.id_credit) || null;

    this.showDetailsModal = true;
    console.log('Détails du paiement:', payment);
    console.log('Crédit associé:', this.selectedPaymentCredit);
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPayment = null;
    this.selectedPaymentCredit = null;
  }

  exportPaymentDetails(): void {
    if (!this.selectedPayment) return;

    const data = [
      {
        'Référence Paiement': this.selectedPayment.reference_paiement,
        'ID Crédit': this.selectedPayment.id_credit,
        Client: this.selectedPayment.username || 'Inconnu',
        'Montant Payé (DT)': this.selectedPayment.montant_paye,
        'Montant Restant (DT)': this.selectedPayment.montant_restant,
        'Date Paiement': new Date(
          this.selectedPayment.date_paiement
        ).toLocaleString(),
        'Mode de Paiement': this.getPaymentModeLabel(
          this.selectedPayment.mode_paiement
        ),
        Description: this.selectedPayment.description || 'Aucune',
        Caissier: this.selectedPayment.caissier_username || 'N/A',
        // Informations du crédit associé
        'Type Crédit': this.selectedPaymentCredit?.type_credit || 'N/A',
        'Solde Crédit Initial (DT)':
          this.selectedPaymentCredit?.solde_credit || 'N/A',
        'Date Début Crédit': this.selectedPaymentCredit?.date_debut
          ? new Date(this.selectedPaymentCredit.date_debut).toLocaleDateString()
          : 'N/A',
        'Durée Crédit (mois)': this.selectedPaymentCredit?.duree_credit || 'N/A',
        'État Crédit': this.selectedPaymentCredit?.etat || 'N/A',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Détails Paiement');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    this.saveAsExcelFile(
      excelBuffer,
      `details_paiement_${this.selectedPayment.reference_paiement}`
    );
  }
}
