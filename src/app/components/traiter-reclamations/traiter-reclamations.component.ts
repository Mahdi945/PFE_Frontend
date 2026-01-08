// traiter-reclamations.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionReclamationsService } from '../../services/gestion-reclamations.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-traiter-reclamations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './traiter-reclamations.component.html',
  styleUrls: ['./traiter-reclamations.component.css'],
})
export class TraiterReclamationsComponent implements OnInit {
  reclamations: any[] = [];
  filteredReclamations: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  selectedReclamation: any = null;
  statutOptions = ['nouveau', 'en_cours', 'resolu', 'fermer'];
  filterStatut = '';
  dateDebut: string = '';
  dateFin: string = '';
  searchTerm: string = '';

  // Modal states
  showDetailsModal = false;
  showConfirmationModal = false;
  showSuccessModal = false;
  showErrorModal = false;

  // Modal messages
  successMessage = '';
  errorModalMessage = '';

  // Pending status change for confirmation
  pendingStatusChange: any = null;

  constructor(private reclamationService: GestionReclamationsService) {}

  ngOnInit(): void {
    this.loadReclamations();
  }

  loadReclamations(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.reclamationService.getAllReclamations().subscribe({
      next: (response: any) => {
        this.reclamations = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : Array.isArray(response.reclamations)
              ? response.reclamations
              : [];
        // Initialiser newStatut pour chaque réclamation
        this.reclamations.forEach(rec => {
          rec.newStatut = rec.statut; // Initialiser newStatut avec la valeur actuelle
        });
        this.filterReclamations();
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage =
          err.message || 'Erreur lors du chargement des réclamations';
        console.error('Erreur:', err);
        this.reclamations = [];
        this.filterReclamations();
        this.isLoading = false;
      },
    });
  }

  filterReclamations(): void {
    try {
      if (!Array.isArray(this.reclamations)) {
        console.error("reclamations n'est pas un tableau:", this.reclamations);
        this.filteredReclamations = [];
        return;
      }

      this.filteredReclamations = this.reclamations.filter(rec => {
        const matchesStatut = !this.filterStatut || rec.statut === this.filterStatut;
        const matchesDate = this.filterByDate(rec.date_creation);
        const matchesSearch =
          !this.searchTerm ||
          (rec.reference &&
            rec.reference.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
          (rec.username &&
            rec.username.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
          (rec.objet &&
            rec.objet.toLowerCase().includes(this.searchTerm.toLowerCase()));
        return matchesStatut && matchesDate && matchesSearch;
      });
    } catch (e) {
      console.error('Erreur dans filterReclamations:', e);
      this.filteredReclamations = [];
    }
  }

  filterByDate(dateString: string): boolean {
    if (!this.dateDebut && !this.dateFin) return true;

    try {
      const recDate = new Date(dateString);
      const startDate = this.dateDebut ? new Date(this.dateDebut) : null;
      const endDate = this.dateFin ? new Date(this.dateFin) : null;

      if (startDate && endDate) {
        return recDate >= startDate && recDate <= endDate;
      } else if (startDate) {
        return recDate >= startDate;
      } else if (endDate) {
        return recDate <= endDate;
      }
      return true;
    } catch (e) {
      console.error('Erreur de format de date:', e);
      return true;
    }
  }
  resetFilters(): void {
    this.filterStatut = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.searchTerm = '';
    this.filterReclamations();
  }

  // Modal management methods
  showReclamationDetails(reclamation: any): void {
    this.selectedReclamation = reclamation;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedReclamation = null;
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
    if (this.pendingStatusChange) {
      // Reset to original status if cancelled
      this.pendingStatusChange.newStatut = this.pendingStatusChange.statut;
      this.pendingStatusChange = null;
    }
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorModalMessage = '';
  }

  onStatutChange(reclamation: any): void {
    if (!reclamation.newStatut || reclamation.newStatut === reclamation.statut)
      return;

    // Check if the new status requires confirmation (resolu or fermer)
    if (reclamation.newStatut === 'resolu' || reclamation.newStatut === 'fermer') {
      this.pendingStatusChange = reclamation;
      this.showConfirmationModal = true;
    } else {
      this.updateStatut(reclamation);
    }
  }

  confirmStatusChange(): void {
    if (this.pendingStatusChange) {
      this.showConfirmationModal = false;
      this.updateStatut(this.pendingStatusChange);
      this.pendingStatusChange = null;
    }
  }
  updateStatut(reclamation: any): void {
    if (!reclamation.newStatut || reclamation.newStatut === reclamation.statut)
      return;

    this.isLoading = true;
    this.errorMessage = null;

    this.reclamationService
      .updateReclamationStatus(reclamation.id, reclamation.newStatut)
      .subscribe({
        next: updatedRec => {
          this.isLoading = false;
          // Afficher la modale de succès AVANT de mettre à jour le tableau
          this.successMessage = `Le statut de la réclamation ${reclamation.reference} a été mis à jour vers "${this.formatStatut(reclamation.newStatut)}".`;
          this.showSuccessModal = true;

          // Mettre à jour le tableau après 2 secondes
          setTimeout(() => {
            reclamation.statut = reclamation.newStatut;
            this.filterReclamations();
          }, 2000);
        },
        error: err => {
          this.isLoading = false;
          // Afficher la modale d'erreur AVANT de revenir à l'ancienne valeur
          this.errorModalMessage =
            err.message || 'Erreur lors de la mise à jour du statut';
          this.showErrorModal = true;

          // Revenir à l'ancienne valeur après 2 secondes
          setTimeout(() => {
            reclamation.newStatut = reclamation.statut;
          }, 2000);
        },
      });
  }

  isStatutDisabled(statut: string, currentStatut: string): boolean {
    // Si l'état actuel est "fermer", toutes les options sont désactivées
    if (currentStatut === 'fermer') {
      return true;
    }

    // Si l'état actuel est "resolu"
    if (currentStatut === 'resolu') {
      // On ne peut que choisir "fermer"
      return statut !== 'fermer';
    }

    // Si l'état actuel est "en_cours"
    if (currentStatut === 'en_cours') {
      // On peut choisir "resolu" ou "fermer"
      return statut === 'nouveau';
    }

    // Si l'état actuel est "nouveau"
    if (currentStatut === 'nouveau') {
      // On peut seulement choisir "en_cours"
      return statut !== 'en_cours';
    }

    // Par défaut, pas de désactivation
    return false;
  }
  exportToExcel(): void {
    if (
      !Array.isArray(this.filteredReclamations) ||
      this.filteredReclamations.length === 0
    ) {
      this.errorMessage = 'Aucune donnée à exporter';
      return;
    }

    const dataToExport = this.filteredReclamations.map(rec => ({
      Référence: rec.reference || 'N/A',
      Client: rec.username || 'N/A',
      Objet: rec.objet || 'N/A',
      Raison: rec.raison || 'N/A',
      Description: rec.description || 'N/A',
      Date: rec.date_creation ? new Date(rec.date_creation).toLocaleString() : 'N/A',
      Statut: rec.statut || 'N/A',
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    XLSX.writeFile(
      workbook,
      `reclamations_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }
  getBadgeClass(statut: string): string {
    switch (statut) {
      case 'nouveau':
        return 'badge bg-primary';
      case 'en_cours':
        return 'badge bg-warning text-dark';
      case 'resolu':
        return 'badge bg-success';
      case 'fermer':
        return 'badge bg-secondary';
      default:
        return 'badge bg-light text-dark';
    }
  }

  formatStatut(statut: string): string {
    switch (statut) {
      case 'nouveau':
        return 'Nouveau';
      case 'en_cours':
        return 'En Cours';
      case 'resolu':
        return 'Résolu';
      case 'fermer':
        return 'Fermé';
      default:
        return statut;
    }
  }
}
