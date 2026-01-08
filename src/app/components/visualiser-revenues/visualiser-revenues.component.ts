import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PompePistoletService } from '../../services/pompes-pistolets.service';
import { GestionCreditsService } from '../../services/gestion-credits.service';
import { GestionStockService } from '../../services/gestion-stock.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-visualiser-revenues',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './visualiser-revenues.component.html',
  styleUrls: ['./visualiser-revenues.component.css'],
})
export class VisualiserRevenuesComponent implements OnInit {
  filterForm: FormGroup;
  reportForm: FormGroup;
  manualReleveForm: FormGroup;
  manualReportForm: FormGroup;
  relevesFilterForm: FormGroup;

  revenuesData: any[] = [];
  paymentsData: any[] = [];
  filteredPayments: any[] = [];
  salesData: any[] = [];
  pistolets: any[] = [];
  affectations: any[] = [];
  relevesPostes: any[] = [];

  loading: boolean = false;
  loadingReleves: boolean = false;
  generatingReport: boolean = false;
  activeTab: string = 'visualisation';

  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  showInfoModal: boolean = false;
  modalMessage: string = '';
  countdown: number = 5;
  countdownInterval: any;

  appliedFilters: any = {};
  appliedRelevesFilters: any = {};

  constructor(
    private fb: FormBuilder,
    private pompeService: PompePistoletService,
    private creditService: GestionCreditsService,
    private stockService: GestionStockService
  ) {
    const today = new Date().toISOString().split('T')[0];

    this.filterForm = this.fb.group({
      date_debut: [today],
      date_fin: [today],
      pistolet_id: [''],
      poste_id: [''],
      payment_date: [today],
      sales_date_debut: [today],
      sales_date_fin: [today],
    });

    this.reportForm = this.fb.group({
      report_date: [today, Validators.required],
    });

    this.manualReleveForm = this.fb.group({
      affectation_id: ['', Validators.required],
      pistolet_id: ['', Validators.required],
      index_ouverture: ['', [Validators.required, Validators.min(0)]],
      index_fermeture: ['', [Validators.required, Validators.min(0)]],
      date_heure: [today, Validators.required],
    });

    this.manualReportForm = this.fb.group({
      date_rapport: [today, Validators.required],
      pistolet_id: ['', Validators.required],
      total_quantite: ['', [Validators.required, Validators.min(0)]],
      total_montant: ['', [Validators.required, Validators.min(0)]],
    });

    this.relevesFilterForm = this.fb.group({
      date_debut: [today],
      date_fin: [today],
      pistolet_id: [''],
      statut: [''],
    });
  }

  ngOnInit(): void {
    this.loadPistolets();
    this.loadInitialData();
    this.loadAffectations();
    this.setupManualReportFormListeners();
  }

  setupManualReportFormListeners(): void {
    // Écouter les changements sur le pistolet et la quantité pour calculer automatiquement le montant
    this.manualReportForm.get('pistolet_id')?.valueChanges.subscribe(() => {
      this.calculateTotalAmount();
    });

    this.manualReportForm.get('total_quantite')?.valueChanges.subscribe(() => {
      this.calculateTotalAmount();
    });
  }

  calculateTotalAmount(): void {
    const pistoletId = this.manualReportForm.get('pistolet_id')?.value;
    const quantite = this.manualReportForm.get('total_quantite')?.value;

    if (pistoletId && quantite && quantite > 0) {
      // Trouver le pistolet sélectionné
      const pistoletSelectionne = this.pistolets.find(p => p.id == pistoletId);

      if (pistoletSelectionne && pistoletSelectionne.prix_unitaire) {
        // Calculer le montant total = quantité × prix unitaire
        const montantTotal = quantite * pistoletSelectionne.prix_unitaire;

        // Mettre à jour le champ montant total
        this.manualReportForm.patchValue(
          {
            total_montant: montantTotal,
          },
          { emitEvent: false }
        ); // emitEvent: false pour éviter une boucle infinie
      }
    } else {
      // Réinitialiser le montant si pas de pistolet ou quantité invalide
      this.manualReportForm.patchValue(
        {
          total_montant: '',
        },
        { emitEvent: false }
      );
    }
  }

  loadInitialData(): void {
    this.appliedFilters = this.filterForm.value;
    this.loadRevenues();
    this.loadPayments();
    this.loadSales();

    this.appliedRelevesFilters = this.relevesFilterForm.value;
    this.loadRelevesPostes();
  }

  loadAllData(): void {
    this.appliedFilters = this.filterForm.value;
    this.loadRevenues();
    this.loadPayments();
    this.loadSales();
  }

  loadPistolets(): void {
    this.loading = true;
    this.pompeService.getAllPistolets().subscribe({
      next: data => {
        this.pistolets = data || [];
        this.loading = false;
      },
      error: err => {
        console.error('Erreur chargement pistolets:', err);
        this.showError('Erreur lors du chargement des pistolets');
        this.loading = false;
      },
    });
  }

  loadAffectations(): void {
    this.loading = true;
    this.loading = false;
  }

  loadRevenues(): void {
    this.loading = true;
    const filters = this.appliedFilters;

    this.pompeService
      .getRevenusJournaliers(
        filters.date_debut,
        filters.date_fin,
        filters.pistolet_id || undefined
      )
      .subscribe({
        next: (response: any) => {
          this.loading = false;

          if (response && Array.isArray(response)) {
            this.revenuesData = this.processRevenueData(response);
          } else if (response && response.data && Array.isArray(response.data)) {
            this.revenuesData = this.processRevenueData(response.data);
          } else {
            this.revenuesData = [];
            this.showInfo('Aucune donnée disponible pour les critères sélectionnés');
          }
        },
        error: err => {
          console.error('Erreur chargement revenus:', err);
          this.loading = false;
          this.revenuesData = [];
          this.showError(
            err.error?.message || 'Erreur lors du chargement des données'
          );
        },
      });
  }

  loadSales(): void {
    this.loading = true;
    const filters = this.appliedFilters;
    const formattedStartDate =
      filters.sales_date_debut || new Date().toISOString().split('T')[0];
    const formattedEndDate =
      filters.sales_date_fin || new Date().toISOString().split('T')[0];

    this.stockService
      .getVentesByDate(formattedStartDate, formattedEndDate + ' 23:59:59')
      .subscribe({
        next: ventes => {
          this.salesData = ventes || [];
          this.loading = false;
        },
        error: err => {
          console.error('Erreur chargement ventes:', err);
          this.salesData = [];
          this.loading = false;
          this.showError(
            err.error?.message || 'Erreur lors du chargement des ventes'
          );
        },
      });
  }

  loadRelevesPostes(): void {
    this.loadingReleves = true;
    const filters = this.appliedRelevesFilters;

    const pistoletId = filters.pistolet_id ? Number(filters.pistolet_id) : null;

    this.pompeService
      .getHistoriqueReleves(pistoletId, filters.date_debut, filters.date_fin)
      .subscribe({
        next: releves => {
          this.relevesPostes = releves || [];

          if (filters.statut) {
            this.relevesPostes = this.relevesPostes.filter(
              r => r.statut === filters.statut
            );
          }

          this.loadingReleves = false;
        },
        error: err => {
          console.error('Erreur chargement relevés:', err);
          this.loadingReleves = false;
          this.showError(
            err.error?.message || 'Erreur lors du chargement des relevés'
          );
        },
      });
  }

  loadPayments(): void {
    this.loading = true;
    const paymentDate = this.appliedFilters.payment_date;

    this.creditService.getAllPayments().subscribe({
      next: (response: any) => {
        this.loading = false;

        let payments = [];
        if (Array.isArray(response)) {
          payments = response;
        } else if (response && Array.isArray(response.data)) {
          payments = response.data;
        } else if (
          response &&
          response.payments &&
          Array.isArray(response.payments)
        ) {
          payments = response.payments;
        }

        this.paymentsData = payments;
        this.filterPaymentsByDate(paymentDate);
      },
      error: err => {
        console.error('Erreur chargement paiements:', err);
        this.loading = false;
        this.paymentsData = [];
        this.filteredPayments = [];
        this.showError(
          err.error?.message || 'Erreur lors du chargement des paiements'
        );
      },
    });
  }

  filterPaymentsByDate(date: string): void {
    if (!date) {
      this.filteredPayments = [...this.paymentsData];
      return;
    }

    const selectedDate = new Date(date).toDateString();
    this.filteredPayments = this.paymentsData.filter(
      p =>
        p.date_paiement && new Date(p.date_paiement).toDateString() === selectedDate
    );
  }

  processRevenueData(data: any[]): any[] {
    const groupedData: { [key: string]: any } = {};

    data.forEach(item => {
      const montant = parseFloat(item.montant) || 0;
      const prixUnitaire = parseFloat(item.prix_unitaire) || 0;
      const quantite = parseFloat(item.quantite) || 0;

      const dateKey = item.date.split('T')[0];
      const pistoletKey = item.pistolet_id;
      const compositeKey = `${dateKey}_${pistoletKey}`;

      if (!groupedData[compositeKey]) {
        groupedData[compositeKey] = {
          date: dateKey,
          pistolet_id: item.pistolet_id,
          nom_produit: item.nom_produit || 'Inconnu',
          prix_unitaire: prixUnitaire,
          nom_pompiste: item.nom_pompiste || 'Non spécifié',
          postes: {
            1: { quantite: 0, montant: 0 },
            2: { quantite: 0, montant: 0 },
            3: { quantite: 0, montant: 0 },
          },
          total_quantite: 0,
          total_montant: 0,
        };
      }

      const posteId = item.poste_id ? Number(item.poste_id) : 0;
      if (posteId >= 1 && posteId <= 3) {
        groupedData[compositeKey].postes[posteId].quantite += quantite;
        groupedData[compositeKey].postes[posteId].montant += montant;
      }

      groupedData[compositeKey].total_quantite += quantite;
      groupedData[compositeKey].total_montant += montant;
    });

    return Object.values(groupedData);
  }

  generateReport(): void {
    if (!this.reportForm.valid) {
      this.showError('Veuillez sélectionner une date valide');
      return;
    }

    this.generatingReport = true;
    const reportDate = this.reportForm.get('report_date')?.value;

    this.pompeService.genererRapportJournalier(reportDate).subscribe({
      next: (response: any) => {
        this.generatingReport = false;
        this.showSuccess(response.message || 'Rapport généré avec succès');
        this.loadRevenues();
      },
      error: err => {
        console.error('Erreur génération rapport:', err);
        this.generatingReport = false;
        this.showError(
          err.error?.message || 'Erreur lors de la génération du rapport'
        );
      },
    });
  }

  addManualReleve(): void {
    if (!this.manualReleveForm.valid) {
      this.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formData = this.manualReleveForm.value;
    this.loading = true;

    this.pompeService.ajouterReleveManuel(formData).subscribe({
      next: response => {
        this.loading = false;
        this.showSuccess('Relevé ajouté manuellement avec succès');
        this.manualReleveForm.reset();
        this.loadRevenues();
      },
      error: err => {
        console.error('Erreur ajout manuel relevé:', err);
        this.loading = false;
        this.showError(err.error?.message || "Erreur lors de l'ajout du relevé");
      },
    });
  }

  addManualReport(): void {
    if (!this.manualReportForm.valid) {
      this.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formData = this.manualReportForm.value;
    this.loading = true;

    this.pompeService.ajouterRapportManuel(formData).subscribe({
      next: response => {
        this.loading = false;
        this.showSuccess('Rapport ajouté manuellement avec succès');
        this.manualReportForm.reset();
        this.loadRevenues();
      },
      error: err => {
        console.error('Erreur ajout manuel rapport:', err);
        this.loading = false;
        this.showError(err.error?.message || "Erreur lors de l'ajout du rapport");
      },
    });
  }

  updateReleveStatut(releveId: number, newStatut: string): void {
    this.pompeService.updateStatutReleve(releveId, newStatut).subscribe({
      next: response => {
        this.showSuccess('Statut du relevé mis à jour avec succès');
        this.loadRelevesPostes();
      },
      error: err => {
        console.error('Erreur mise à jour statut:', err);
        this.showError(
          err.error?.message || 'Erreur lors de la mise à jour du statut'
        );
        this.loadRelevesPostes();
      },
    });
  }

  updateIndexFermeture(
    releveId: number,
    pistoletId: number,
    newIndex: number
  ): void {
    if (!newIndex && newIndex !== 0) {
      this.showError("Veuillez entrer une valeur valide pour l'index de fermeture");
      return;
    }

    this.loadingReleves = true;

    this.pompeService.updateIndexFermeture(pistoletId, newIndex).subscribe({
      next: response => {
        this.loadingReleves = false;
        this.showSuccess('Index de fermeture mis à jour avec succès');

        const releveIndex = this.relevesPostes.findIndex(r => r.id === releveId);
        if (releveIndex !== -1) {
          this.relevesPostes[releveIndex].index_fermeture = newIndex;
          this.relevesPostes[releveIndex].quantite =
            newIndex - this.relevesPostes[releveIndex].index_ouverture;
        }
      },
      error: err => {
        console.error('Erreur mise à jour index:', err);
        this.loadingReleves = false;
        this.showError(
          err.error?.message || "Erreur lors de la mise à jour de l'index"
        );
        this.loadRelevesPostes();
      },
    });
  }

  getPistoletInfo(pistoletId: number): any {
    return this.pistolets.find(p => p.id === pistoletId);
  }

  confirmDeleteReleve(releveId: number): void {
    if (
      confirm(
        'Êtes-vous sûr de vouloir supprimer ce relevé ? Cette action est irréversible.'
      )
    ) {
      this.deleteReleve(releveId);
    }
  }

  deleteReleve(releveId: number): void {
    this.loadingReleves = true;
    this.updateReleveStatut(releveId, 'annule');
  }

  exportToExcel(): void {
    const revenueData = this.revenuesData.map(item => ({
      Date: item.date,
      Produit: item.nom_produit,
      Pompiste: item.nom_pompiste,
      'Prix Unitaire (DT)': item.prix_unitaire,
      'Matin (Quantité)': item.postes[1].quantite,
      'Après-midi (Quantité)': item.postes[2].quantite,
      'Nuit (Quantité)': item.postes[3].quantite,
      'Total (Quantité)': item.total_quantite,
      'Matin (Montant DT)': item.postes[1].montant,
      'Après-midi (Montant DT)': item.postes[2].montant,
      'Nuit (Montant DT)': item.postes[3].montant,
      'Total (Montant DT)': item.total_montant,
    }));

    const paymentData = this.filteredPayments.map(p => ({
      Référence: p.reference_paiement || 'N/A',
      Client: p.username || 'Inconnu',
      'Montant (DT)': p.montant_paye,
      Date: new Date(p.date_paiement).toLocaleDateString(),
      Mode: this.getPaymentModeLabel(p.mode_paiement),
    }));

    const salesData = this.salesData.map(s => ({
      'N°': s.id,
      Date: new Date(s.date_vente).toLocaleDateString(),
      Caissier: s.nom_caissier || 'Inconnu',
      'Total (DT)': s.montant_total,
      'Mode Paiement': s.mode_paiement,
      Statut: s.statut,
    }));

    const totalRevenus = this.getTotalMontant();
    const totalPaiements = this.getTotalPayments();
    const totalVentes = this.getTotalSales();
    const totalCaisse = totalRevenus + totalPaiements + totalVentes;

    const summaryData = [
      { Description: 'TOTAL REVENUS PISTOLETS', 'Montant (DT)': totalRevenus },
      { Description: 'TOTAL PAIEMENTS CREDITS', 'Montant (DT)': totalPaiements },
      { Description: 'TOTAL VENTES', 'Montant (DT)': totalVentes },
      { Description: 'TOTAL CAISSE', 'Montant (DT)': totalCaisse },
    ];

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(revenueData),
      'Revenus'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(paymentData),
      'Paiements'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(salesData),
      'Ventes'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summaryData),
      'Résumé'
    );

    XLSX.writeFile(
      workbook,
      `Caisse_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  }

  calculateEcart(item: any): number {
    const quantites = [
      item.postes[1].quantite,
      item.postes[2].quantite,
      item.postes[3].quantite,
    ];
    return Math.max(...quantites) - Math.min(...quantites);
  }

  getTotalQuantite(): number {
    return this.revenuesData.reduce(
      (sum, item) => sum + (item.total_quantite || 0),
      0
    );
  }

  getTotalMontant(): number {
    return this.revenuesData.reduce(
      (sum, item) => sum + (item.total_montant || 0),
      0
    );
  }

  getTotalQuantitePoste(posteId: number): number {
    return this.revenuesData.reduce(
      (sum, item) => sum + (item.postes[posteId]?.quantite || 0),
      0
    );
  }

  getTotalMontantPoste(posteId: number): number {
    return this.revenuesData.reduce(
      (sum, item) => sum + (item.postes[posteId]?.montant || 0),
      0
    );
  }

  getTotalPayments(): number {
    return this.filteredPayments.reduce((sum, p) => sum + (p.montant_paye || 0), 0);
  }

  getTotalSales(): number {
    return this.salesData.reduce((total, sale) => {
      const montant =
        typeof sale.montant_total === 'string'
          ? parseFloat(sale.montant_total)
          : sale.montant_total;
      return total + (montant || 0);
    }, 0);
  }

  getTotalPaye(): number {
    return this.salesData.reduce((total, sale) => {
      const montant =
        typeof sale.montant_paye === 'string'
          ? parseFloat(sale.montant_paye)
          : sale.montant_paye;
      return total + (montant || 0);
    }, 0);
  }

  getTotalRendue(): number {
    return this.salesData.reduce((total, sale) => {
      const montant =
        typeof sale.monnaie_rendue === 'string'
          ? parseFloat(sale.monnaie_rendue)
          : sale.monnaie_rendue;
      return total + (montant || 0);
    }, 0);
  }

  getResteEnCaisse(): number {
    return this.getTotalPaye() - this.getTotalRendue();
  }

  getPaymentModeLabel(mode: string): string {
    switch (mode) {
      case 'especes':
        return 'Espèces';
      case 'carte':
        return 'Carte';
      case 'virement':
        return 'Virement';
      case 'cheque':
        return 'Chèque';
      default:
        return mode;
    }
  }

  showSuccess(message: string): void {
    this.modalMessage = message;
    this.showSuccessModal = true;
    this.startCountdown();
  }

  showError(message: string): void {
    this.modalMessage = message;
    this.showErrorModal = true;
  }

  showInfo(message: string): void {
    this.modalMessage = message;
    this.showInfoModal = true;
    setTimeout(() => (this.showInfoModal = false), 3000);
  }

  startCountdown(): void {
    this.countdown = 5;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.showSuccessModal = false;
      }
    }, 1000);
  }

  closeModal(): void {
    this.showSuccessModal = false;
    this.showErrorModal = false;
    this.showInfoModal = false;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'visualisation') {
      this.loadRevenues();
      this.loadPayments();
      this.loadSales();
    } else if (tab === 'releves-postes') {
      this.loadRelevesPostes();
    }
  }

  applyFilters(): void {
    this.appliedFilters = this.filterForm.value;
    this.loadRevenues();
    this.loadPayments();
    this.loadSales();
  }
  applyRelevesFilters(): void {
    this.appliedRelevesFilters = this.relevesFilterForm.value;
    this.loadRelevesPostes();
  }

  // Méthode pour obtenir le prix unitaire d'un pistolet par son ID
  getPrixUnitairePistolet(pistoletId: any): number {
    if (!pistoletId || !this.pistolets) {
      return 0;
    }

    const pistolet = this.pistolets.find(p => p.id == pistoletId);
    return pistolet ? pistolet.prix_unitaire : 0;
  }
}
