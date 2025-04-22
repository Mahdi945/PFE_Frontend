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
}

@Component({
  selector: 'app-gestion-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './gestion-transactions.component.html',
  styleUrls: ['./gestion-transactions.component.css']
})
export class GestionTransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  isLoading: boolean = false;
  showDetailsModal: boolean = false;
  selectedTransaction: Transaction | null = null;

  // Filtres simplifiés
  searchTerm: string = '';
  selectedCredit: number | null = null;
  selectedUser: number | null = null;
  selectedImmatriculation: string = '';
  selectedDate: string | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  totalAmount: number = 0;

  // Données pour les filtres
  credits: {id: number}[] = [];
  users: {id: number, username: string}[] = [];
  immatriculations: string[] = [];

  constructor(private creditService: GestionCreditsService) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadFilterData();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.creditService.getAllTransactions().subscribe({
      next: (data: any) => {
        this.transactions = Array.isArray(data) ? data.map(t => ({
          ...t,
          montant_restant: t.solde_credit - t.credit_utilise
        })) : [];
        this.filterTransactions();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.transactions = [];
        this.filteredTransactions = [];
        this.isLoading = false;
      }
    });
  }

  loadFilterData(): void {
    // Charger les crédits pour le filtre
    this.creditService.getAllCredits().subscribe({
      next: (credits: any) => {
        this.credits = Array.isArray(credits) ? credits : [];
      }
    });

    // Charger les utilisateurs pour le filtre
    this.creditService.getAllUsers().subscribe({
      next: (users: any) => {
        this.users = Array.isArray(users) ? users : [];
      }
    });

    // Charger les immatriculations uniques
    this.creditService.getAllVehicules().subscribe({
      next: (vehicules: any) => {
        this.immatriculations = Array.isArray(vehicules) 
          ? [...new Set(vehicules.map((v: any) => v.immatriculation))] 
          : [];
      }
    });
  }

  filterTransactions(): void {
    let results = [...this.transactions];

    // Filtre par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(t => 
        t.id.toString().includes(term) ||
        t.username.toLowerCase().includes(term)
      );
    }

    // Filtre par crédit
    if (this.selectedCredit) {
      results = results.filter(t => t.id_credit === this.selectedCredit);
    }

    // Filtre par utilisateur
    if (this.selectedUser) {
      results = results.filter(t => t.id_utilisateur === this.selectedUser);
    }

    // Filtre par immatriculation
    if (this.selectedImmatriculation) {
      results = results.filter(t => 
        t.immatriculation.toLowerCase().includes(this.selectedImmatriculation.toLowerCase())
      );
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
    this.totalAmount = this.filteredTransactions.reduce((sum, t) => sum + t.montant, 0);
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize);
    this.currentPage = 1;
  }

  openDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
  }

  exportToExcel(): void {
    const dataToExport = this.filteredTransactions.length > 0 ? 
      this.filteredTransactions : 
      this.transactions;

    if (dataToExport.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const data = dataToExport.map(t => ({
      'ID': t.id,
      'Date': new Date(t.date_transaction).toLocaleString(),
      'Username': t.username,
      'Immatriculation': t.immatriculation,
      'Quantité (L)': t.quantite,
      'Montant (DT)': t.montant,
      'Solde Crédit': t.solde_credit,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    const fileName = `transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible/2));
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