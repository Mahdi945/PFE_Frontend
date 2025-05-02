import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PompePistoletService } from '../../services/pompes-pistolets.service';
import { CommonModule } from '@angular/common';
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
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './visualiser-revenues.component.html',
  styleUrls: ['./visualiser-revenues.component.css']
})
export class VisualiserRevenuesComponent implements OnInit {
  filterForm: FormGroup;
  reportForm: FormGroup;
  manualReleveForm: FormGroup;
  manualReportForm: FormGroup;
  revenuesData: any[] = [];
  pistolets: any[] = [];
  affectations: any[] = [];
  loading: boolean = false;
  generatingReport: boolean = false;
  activeTab: string = 'visualisation';
  
  // Modales
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  showInfoModal: boolean = false;
  modalMessage: string = '';
  countdown: number = 5;
  countdownInterval: any;

  // Taux de conversion Euro vers Dinar Tunisien
  tauxConversion = 3.24;

  constructor(
    private fb: FormBuilder,
    private pompeService: PompePistoletService
  ) {
    const today = new Date().toISOString().split('T')[0];
    
    // Formulaire de filtres
    this.filterForm = this.fb.group({
      date_debut: [today],
      date_fin: [today],
      pistolet_id: [''],
      poste_id: ['']
    });

    // Formulaire de génération de rapport
    this.reportForm = this.fb.group({
      report_date: [today]
    });

    // Formulaire d'ajout manuel de relevé
    this.manualReleveForm = this.fb.group({
      affectation_id: ['', Validators.required],
      pistolet_id: ['', Validators.required],
      index_ouverture: ['', [Validators.required, Validators.min(0)]],
      index_fermeture: ['', [Validators.required, Validators.min(0)]],
      date_heure: [today, Validators.required]
    });

    // Formulaire d'ajout manuel de rapport
    this.manualReportForm = this.fb.group({
      date_rapport: [today, Validators.required],
      pistolet_id: ['', Validators.required],
      total_quantite: ['', [Validators.required, Validators.min(0)]],
      total_montant: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadPistolets();
    this.loadRevenues();
    this.loadAffectations();
  }

  loadPistolets(): void {
    this.loading = true;
    this.pompeService.getAllPistolets().subscribe({
      next: (data) => {
        this.pistolets = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement pistolets:', err);
        this.showError('Erreur lors du chargement des pistolets');
        this.loading = false;
      }
    });
  }

  loadAffectations(): void {
    this.loading = true;
    // Implémentez cette méthode dans votre service si nécessaire
    // this.pompeService.getAffectations().subscribe(...)
  }

  loadRevenues(): void {
    this.loading = true;
    const filters = this.filterForm.value;

    this.pompeService.getRevenusJournaliers(
      filters.date_debut,
      filters.date_fin,
      filters.pistolet_id || undefined
    ).subscribe({
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
      error: (err) => {
        console.error('Erreur chargement revenus:', err);
        this.loading = false;
        this.revenuesData = [];
        this.showError(err.error?.message || 'Erreur lors du chargement des données');
      }
    });
  }

  processRevenueData(data: any[]): any[] {
    const groupedData: {[key: string]: any} = {};

    data.forEach(item => {
      // Utilisation directe des valeurs sans conversion
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
            1: { quantite: 0, montant: 0 }, // Matin
            2: { quantite: 0, montant: 0 }, // Après-midi
            3: { quantite: 0, montant: 0 }  // Nuit
          },
          total_quantite: 0,
          total_montant: 0
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
      error: (err) => {
        console.error('Erreur génération rapport:', err);
        this.generatingReport = false;
        this.showError(err.error?.message || 'Erreur lors de la génération du rapport');
      }
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
      next: (response) => {
        this.loading = false;
        this.showSuccess('Relevé ajouté manuellement avec succès');
        this.manualReleveForm.reset();
        this.loadRevenues();
      },
      error: (err) => {
        console.error('Erreur ajout manuel relevé:', err);
        this.loading = false;
        this.showError(err.error?.message || 'Erreur lors de l\'ajout du relevé');
      }
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
      next: (response) => {
        this.loading = false;
        this.showSuccess('Rapport ajouté manuellement avec succès');
        this.manualReportForm.reset();
        this.loadRevenues();
      },
      error: (err) => {
        console.error('Erreur ajout manuel rapport:', err);
        this.loading = false;
        this.showError(err.error?.message || 'Erreur lors de l\'ajout du rapport');
      }
    });
  }

  exportToExcel(): void {
    const dataToExport = this.revenuesData.map(item => {
      const excelData: any = {
        'Date': item.date,
        'Produit': item.nom_produit,
        'Pompiste': item.nom_pompiste,
        'Prix Unitaire (DT)': item.prix_unitaire
      };

      // Ajout des quantités et montants par poste
      excelData['Matin (Quantité)'] = item.postes[1].quantite;
      excelData['Après-midi (Quantité)'] = item.postes[2].quantite;
      excelData['Nuit (Quantité)'] = item.postes[3].quantite;
      
      excelData['Matin (Montant DT)'] = item.postes[1].montant;
      excelData['Après-midi (Montant DT)'] = item.postes[2].montant;
      excelData['Nuit (Montant DT)'] = item.postes[3].montant;
      
      // Totaux
      excelData['Total (Quantité)'] = item.total_quantite;
      excelData['Total (Montant DT)'] = item.total_montant;

      return excelData;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = { 
      Sheets: { 'Revenus': worksheet }, 
      SheetNames: ['Revenus'] 
    };
    XLSX.writeFile(workbook, `Revenus_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  calculateEcart(item: any): number {
    const quantites = [
      item.postes[1].quantite,
      item.postes[2].quantite,
      item.postes[3].quantite
    ];
    return Math.max(...quantites) - Math.min(...quantites);
  }
  // Calcul des totaux généraux
getTotalQuantite(): number {
  return this.revenuesData.reduce((sum, item) => sum + (item.total_quantite || 0), 0);
}

getTotalMontant(): number {
  return this.revenuesData.reduce((sum, item) => sum + (item.total_montant || 0), 0);
}

// Calcul des totaux par poste
getTotalQuantitePoste(posteId: number): number {
  return this.revenuesData.reduce((sum, item) => sum + (item.postes[posteId]?.quantite || 0), 0);
}

getTotalMontantPoste(posteId: number): number {
  return this.revenuesData.reduce((sum, item) => sum + (item.postes[posteId]?.montant || 0), 0);
}

// Calcul de la recette d'aujourd'hui
getRecetteAujourdhui(): number {
  const today = new Date().toISOString().split('T')[0];
  return this.revenuesData
    .filter(item => item.date === today)
    .reduce((sum, item) => sum + (item.total_montant || 0), 0);
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
    setTimeout(() => this.showInfoModal = false, 3000);
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
  }
}