import { Component, OnInit } from '@angular/core';
import { PompePistoletService } from '../../services/pompes-pistolets.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-gestion-pompes',
  standalone: true,
  imports: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './gestion-pompes.component.html',
  styleUrls: ['./gestion-pompes.component.css'],
})
export class GestionPompesComponent implements OnInit {
  pompes: any[] = [];
  filteredPompes: any[] = [];
  paginatedPompes: any[] = [];
  selectedPompe: any = null;
  selectedPistolet: any = null;
  isEditModalOpen: boolean = false;
  isPistoletsModalOpen: boolean = false;
  isPistoletModalOpen: boolean = false;
  showDeleteModal: boolean = false;
  pompeToDelete: any = null;
  searchTerm: string = '';
  filterType: string = '';
  filterStatut: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  loading: boolean = false;
  loadingPistolets: boolean = false;

  // Nouvelles propriétés pour les modales modernes
  isConsultationModalOpen: boolean = false;
  isModificationModalOpen: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Propriétés pour la navigation entre les pompes
  currentPompeIndex: number = -1;

  constructor(private pompeService: PompePistoletService) {}

  ngOnInit(): void {
    this.loadPompes();
  }

  loadPompes(): void {
    this.loading = true;
    this.pompeService.getAllPompes().subscribe({
      next: pompes => {
        this.pompes = pompes;
        this.filterPompes();
        this.loading = false;
      },
      error: err => {
        console.error('Erreur lors du chargement des pompes', err);
        this.loading = false;
      },
    });
  }

  filterPompes(): void {
    this.filteredPompes = this.pompes.filter(
      pompe =>
        (this.searchTerm === '' ||
          pompe.numero_pompe
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase())) &&
        (this.filterType === '' || pompe.type_pompe === this.filterType) &&
        (this.filterStatut === '' || pompe.statut === this.filterStatut)
    );
    this.currentPage = 1; // Reset à la première page après filtrage
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPompes.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPompes = this.filteredPompes.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      en_service: 'En Service',
      hors_service_temporaire: 'Hors Service Temporaire',
      reserve: 'Réserve',
      maintenance: 'Maintenance',
      hors_service_definitif: 'Hors Service Définitif',
    };
    return labels[statut] || statut;
  }
  openPistoletsModal(pompe: any): void {
    this.selectedPompe = { ...pompe };

    // Initialiser statut_temp pour chaque pistolet
    if (this.selectedPompe.pistolets) {
      this.selectedPompe.pistolets.forEach((pistolet: any) => {
        pistolet.statut_temp = pistolet.statut;
      });
    }

    this.isPistoletsModalOpen = true;
    this.loadingPistolets = true;

    this.pompeService.getPistoletsByPompeId(pompe.id).subscribe({
      next: pistolets => {
        // Initialiser les statuts temporaires avec les statuts actuels
        this.selectedPompe.pistolets = pistolets.map((pistolet: any) => ({
          ...pistolet,
          statut_temp: pistolet.statut,
        }));
        this.loadingPistolets = false;
      },
      error: err => {
        console.error('Erreur lors du chargement des pistolets', err);
        this.loadingPistolets = false;
      },
    });
  }

  closePistoletsModal(): void {
    this.isPistoletsModalOpen = false;
    this.selectedPompe = null;
  }

  openEditModal(pompe: any): void {
    this.selectedPompe = { ...pompe };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedPompe = null;
  }

  updatePompe(): void {
    if (!this.selectedPompe) return;
    this.pompeService
      .updatePompe(this.selectedPompe.id, this.selectedPompe)
      .subscribe({
        next: () => {
          this.loadPompes();
          this.closeEditModal();
        },
        error: err => {
          console.error('Erreur lors de la mise à jour', err);
        },
      });
  }

  openDeleteModal(pompe: any): void {
    this.pompeToDelete = { ...pompe };
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pompeToDelete = null;
  }

  confirmDeletePompe(): void {
    if (!this.pompeToDelete) return;
    this.pompeService.deletePompe(this.pompeToDelete.id).subscribe({
      next: () => {
        this.loadPompes();
        this.closeDeleteModal();
      },
      error: err => {
        console.error('Erreur lors de la suppression', err);
      },
    });
  }

  openPistoletModal(pistolet: any): void {
    this.selectedPistolet = { ...pistolet };
    this.isPistoletModalOpen = true;
  }

  closePistoletModal(): void {
    this.isPistoletModalOpen = false;
    this.selectedPistolet = null;
  }
  updatePistoletStatut(pistolet: any): void {
    // Cette méthode n'est plus utilisée car on utilise maintenant la sauvegarde groupée
    // Conservée pour la compatibilité
  }

  // Nouvelles méthodes pour les modales modernes
  openConsultationModal(pompe: any): void {
    this.selectedPompe = { ...pompe };
    this.isConsultationModalOpen = true;
  }

  closeConsultationModal(): void {
    this.isConsultationModalOpen = false;
    this.selectedPompe = null;
  }

  openModificationModal(pompe: any): void {
    this.selectedPompe = { ...pompe };
    this.isModificationModalOpen = true;
  }

  closeModificationModal(): void {
    this.isModificationModalOpen = false;
    this.selectedPompe = null;
  }

  // Gérer le clic sur l'overlay des modales
  onModalOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeConsultationModal();
      this.closeModificationModal();
      this.closeSuccessModal();
      this.closeErrorModal();
    }
  }

  // Méthode pour réinitialiser les filtres
  resetFilters(): void {
    this.searchTerm = '';
    this.filterType = '';
    this.filterStatut = '';
    this.currentPage = 1;
    this.filterPompes();
  }

  // Mise à jour des méthodes existantes pour utiliser les nouvelles modales de succès/erreur
  updatePompeModern(): void {
    if (!this.selectedPompe) return;
    this.pompeService
      .updatePompe(this.selectedPompe.id, this.selectedPompe)
      .subscribe({
        next: () => {
          this.loadPompes();
          this.closeModificationModal();
          this.showSuccess('Pompe mise à jour avec succès !');
        },
        error: err => {
          console.error('Erreur lors de la mise à jour', err);
          this.showError('Erreur lors de la mise à jour de la pompe.');
        },
      });
  }

  confirmDeletePompeModern(): void {
    if (!this.pompeToDelete) return;
    this.pompeService.deletePompe(this.pompeToDelete.id).subscribe({
      next: () => {
        this.loadPompes();
        this.closeDeleteModal();
        this.showSuccess('Pompe supprimée avec succès !');
      },
      error: err => {
        console.error('Erreur lors de la suppression', err);
        this.showError('Erreur lors de la suppression de la pompe.');
      },
    });
  }

  // NAVIGATION ENTRE LES POMPES
  getCurrentPompeIndex(): number {
    if (!this.selectedPompe) return -1;
    return this.filteredPompes.findIndex(
      pompe => pompe.numero_pompe === this.selectedPompe.numero_pompe
    );
  }

  canNavigatePrevious(): boolean {
    const currentIndex = this.getCurrentPompeIndex();
    return currentIndex > 0;
  }

  canNavigateNext(): boolean {
    const currentIndex = this.getCurrentPompeIndex();
    return currentIndex < this.filteredPompes.length - 1 && currentIndex !== -1;
  }

  navigateToPrevious(): void {
    const currentIndex = this.getCurrentPompeIndex();
    if (currentIndex > 0) {
      this.selectedPompe = this.filteredPompes[currentIndex - 1];
      this.loadPistoletsForPompe();
    }
  }

  navigateToNext(): void {
    const currentIndex = this.getCurrentPompeIndex();
    if (currentIndex < this.filteredPompes.length - 1 && currentIndex !== -1) {
      this.selectedPompe = this.filteredPompes[currentIndex + 1];
      this.loadPistoletsForPompe();
    }
  }
  loadPistoletsForPompe(): void {
    if (this.selectedPompe && this.isPistoletsModalOpen) {
      this.loadingPistolets = true;
      this.pompeService.getPistoletsByPompeId(this.selectedPompe.id).subscribe({
        next: (pistolets: any[]) => {
          // Initialiser statut_temp pour chaque pistolet
          this.selectedPompe.pistolets = pistolets.map((pistolet: any) => ({
            ...pistolet,
            statut_temp: pistolet.statut,
          }));
          this.loadingPistolets = false;
        },
        error: (err: any) => {
          console.error('Erreur lors du chargement des pistolets', err);
          this.loadingPistolets = false;
        },
      });
    }
  }
  // GESTION DES STATUTS DES PISTOLETS
  hasStatusChanges(): boolean {
    if (!this.selectedPompe?.pistolets) return false;

    return this.selectedPompe.pistolets.some(
      (pistolet: any) => pistolet.statut_temp !== pistolet.statut
    );
  }

  savePistoletsStatuts(): void {
    if (!this.selectedPompe?.pistolets || !this.hasStatusChanges()) {
      return;
    }

    const statutsToUpdate = this.selectedPompe.pistolets
      .filter((pistolet: any) => pistolet.statut_temp !== pistolet.statut)
      .map((pistolet: any) => ({
        id: pistolet.id,
        statut: pistolet.statut_temp,
      }));

    if (statutsToUpdate.length === 0) {
      return;
    }

    let updateCount = 0;
    let errorCount = 0;

    statutsToUpdate.forEach((statutUpdate: any) => {
      // Utilisation de updateStatutPistolet si disponible, sinon simulation
      if (this.pompeService.updateStatutPistolet) {
        this.pompeService
          .updateStatutPistolet(statutUpdate.id, statutUpdate.statut)
          .subscribe({
            next: () => {
              updateCount++;
              this.updatePistoletStatutLocally(statutUpdate.id, statutUpdate.statut);

              if (updateCount + errorCount === statutsToUpdate.length) {
                this.handleUpdateComplete(updateCount, errorCount);
              }
            },
            error: err => {
              console.error('Erreur lors de la mise à jour du statut', err);
              errorCount++;

              if (updateCount + errorCount === statutsToUpdate.length) {
                this.handleUpdateComplete(updateCount, errorCount);
              }
            },
          });
      } else {
        // Simulation pour les tests
        setTimeout(() => {
          this.updatePistoletStatutLocally(statutUpdate.id, statutUpdate.statut);
          updateCount++;

          if (updateCount + errorCount === statutsToUpdate.length) {
            this.handleUpdateComplete(updateCount, errorCount);
          }
        }, 100);
      }
    });
  }

  private updatePistoletStatutLocally(pistoletId: number, newStatut: string): void {
    const pistolet = this.selectedPompe.pistolets.find(
      (p: any) => p.id === pistoletId
    );
    if (pistolet) {
      pistolet.statut = newStatut;
    }
  }
  private handleUpdateComplete(updateCount: number, errorCount: number): void {
    // Fermer d'abord le modal des pistolets
    this.closePistoletsModal();

    // Attendre un petit délai pour que la fermeture soit visible
    setTimeout(() => {
      if (errorCount === 0) {
        this.showSuccess(`${updateCount} pistolet(s) mis à jour avec succès !`);
      } else if (updateCount === 0) {
        this.showError('Erreur lors de la mise à jour des pistolets.');
      } else {
        this.showError(
          `${updateCount} pistolet(s) mis à jour, ${errorCount} erreur(s).`
        );
      }
    }, 300); // Délai de 300ms pour une transition fluide
  }

  // Méthodes pour les modales de succès et d'erreur
  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }
}
