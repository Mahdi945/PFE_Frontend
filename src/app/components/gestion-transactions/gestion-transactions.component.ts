import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionCreditsService } from '../../services/gestion-credits.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

interface Transaction {
  id: number;
  id_vehicule: number;
  id_utilisateur: number;
  id_credit: number;
  quantite: number;
  montant: number;
  date_transaction: string;
  immatriculation: string;
  marque: string;
  type_vehicule: string;
  username: string;
  solde_credit: number;
  credit_utilise: number;
  montant_restant: number;
  numero_telephone: number;
  email: string;
  preuve: string; // URL de la preuve
  pompiste_username: string;
  mode_paiement?: string; // Mode de paiement
}

@Component({
  selector: 'app-gestion-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './gestion-transactions.component.html',
  styleUrls: ['./gestion-transactions.component.css'],
})
export class GestionTransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  isLoading: boolean = false;
  showDetailsModal: boolean = false;
  selectedTransaction: Transaction | null = null;
  isImageZoomed: boolean = false; // Filtres
  searchTerm: string = '';
  searchTransactionId: string = '';
  searchCreditId: string = '';
  selectedCredit: number | null = null;
  selectedUser: number | null = null;
  selectedImmatriculation: string = '';
  selectedDate: string | null = null;
  selectedMode: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Statistiques
  totalAmount: number = 0;
  totalQuantity: number = 0;
  averageAmount: number = 0;

  // Données pour les filtres
  credits: { id: number }[] = [];
  users: { id: number; username: string }[] = [];
  immatriculations: string[] = [];
  modes: string[] = ['Espèces', 'Carte', 'Virement', 'Chèque'];

  constructor(private creditService: GestionCreditsService) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadFilterData();
  }
  loadTransactions(): void {
    this.isLoading = true;
    this.creditService.getAllTransactions().subscribe({
      next: (data: any) => {
        this.transactions = Array.isArray(data)
          ? data.map(t => ({
              ...t,
              montant: Number(t.montant) || 0,
              quantite: Number(t.quantite) || 0,
              montant_restant: t.solde_credit - t.credit_utilise,
              preuve: t.preuve || 'assets/img/img1.jpg', // Chemin par défaut si aucune image
              mode_paiement: t.mode_paiement || 'Espèces', // Mode par défaut
            }))
          : [];
        this.filterTransactions();
        this.isLoading = false;
      },
      error: err => {
        console.error('Erreur:', err);
        this.transactions = [];
        this.filteredTransactions = [];
        this.updateStatistics();
        this.isLoading = false;
      },
    });
  }

  loadFilterData(): void {
    // Charger les crédits pour le filtre
    this.creditService.getAllCredits().subscribe({
      next: (credits: any) => {
        this.credits = Array.isArray(credits) ? credits : [];
      },
    });

    // Charger les utilisateurs pour le filtre
    this.creditService.getAllUsers().subscribe({
      next: (users: any) => {
        this.users = Array.isArray(users) ? users : [];
      },
    });

    // Charger les immatriculations uniques
    this.creditService.getAllVehicules().subscribe({
      next: (vehicules: any) => {
        this.immatriculations = Array.isArray(vehicules)
          ? [...new Set(vehicules.map((v: any) => v.immatriculation))]
          : [];
      },
    });
  }
  filterTransactions(): void {
    let results = [...this.transactions]; // Filtre par terme de recherche général (nom client, immatriculation)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(
        t =>
          t.username.toLowerCase().includes(term) ||
          t.immatriculation.toLowerCase().includes(term)
      );
    }

    // Filtre par ID transaction spécifique
    if (this.searchTransactionId) {
      const transactionId = this.searchTransactionId.toLowerCase();
      results = results.filter(t => t.id.toString().includes(transactionId));
    }

    // Filtre par ID crédit spécifique
    if (this.searchCreditId) {
      const creditId = this.searchCreditId.toLowerCase();
      results = results.filter(t => t.id_credit.toString().includes(creditId));
    }

    // Filtre par mode de paiement
    if (this.selectedMode) {
      results = results.filter(t => t.mode_paiement === this.selectedMode);
    }

    // Filtre par date
    if (this.selectedDate) {
      const date = new Date(this.selectedDate);
      results = results.filter(t => {
        const transactionDate = new Date(t.date_transaction);
        return transactionDate.toDateString() === date.toDateString();
      });
    }

    this.filteredTransactions = results;
    this.updateStatistics();
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize);
    this.currentPage = 1;
  }
  updateStatistics(): void {
    this.totalAmount = this.filteredTransactions.reduce(
      (sum, t) => sum + (Number(t.montant) || 0),
      0
    );
    this.totalQuantity = this.filteredTransactions.reduce(
      (sum, t) => sum + (Number(t.quantite) || 0),
      0
    );
    this.averageAmount =
      this.filteredTransactions.length > 0
        ? this.totalAmount / this.filteredTransactions.length
        : 0;
  }

  openDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
    this.isImageZoomed = false; // Réinitialiser le zoom
    document.body.style.overflow = 'hidden'; // Empêcher le défilement de la page
  }
  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
    this.isImageZoomed = false;
    document.body.style.overflow = ''; // Rétablir le défilement
  }

  closeDetailsModal(): void {
    this.closeDetails();
  }

  exportTransactionDetails(): void {
    if (!this.selectedTransaction) return;

    const data = [
      {
        'ID Transaction': this.selectedTransaction.id,
        Date: new Date(this.selectedTransaction.date_transaction).toLocaleString(),
        Client: this.selectedTransaction.username,
        Email: this.selectedTransaction.email,
        Téléphone: this.selectedTransaction.numero_telephone,
        Immatriculation: this.selectedTransaction.immatriculation,
        Marque: this.selectedTransaction.marque,
        'Type Véhicule': this.selectedTransaction.type_vehicule,
        'Quantité (L)': this.selectedTransaction.quantite,
        'Montant (DT)': this.selectedTransaction.montant,
        'Mode Paiement': this.selectedTransaction.mode_paiement,
        Pompiste: this.selectedTransaction.pompiste_username,
        'Crédit ID': this.selectedTransaction.id_credit,
        'Solde Crédit': this.selectedTransaction.solde_credit,
        'Crédit Utilisé': this.selectedTransaction.credit_utilise,
        'Montant Restant': this.selectedTransaction.montant_restant,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Détail Transaction');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const fileName = `transaction_${this.selectedTransaction.id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  downloadProof(): void {
    if (!this.selectedTransaction?.preuve) {
      alert('Aucune preuve disponible pour cette transaction');
      return;
    }

    const link = document.createElement('a');
    link.href = this.selectedTransaction.preuve;
    link.download = `preuve_transaction_${this.selectedTransaction.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  toggleImageZoom(): void {
    this.isImageZoomed = !this.isImageZoomed;
    if (this.isImageZoomed) {
      document.body.style.overflow = 'hidden'; // Empêcher le défilement quand l'image est zoomée
    } else {
      document.body.style.overflow = ''; // Rétablir le défilement
    }
  }

  exportToExcel(): void {
    const dataToExport =
      this.filteredTransactions.length > 0
        ? this.filteredTransactions
        : this.transactions;

    if (dataToExport.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const data = dataToExport.map(t => ({
      ID: t.id,
      Date: new Date(t.date_transaction).toLocaleString(),
      Username: t.username,
      Immatriculation: t.immatriculation,
      'Quantité (L)': t.quantite,
      'Montant (DT)': t.montant,
      Pompiste: t.pompiste_username,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const fileName = `transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(data, fileName);
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
}
