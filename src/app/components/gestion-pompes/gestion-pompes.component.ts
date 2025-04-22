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
  imports: [NavbarComponent, SidebarComponent, FooterComponent, CommonModule, FormsModule,RouterModule],
  templateUrl: './gestion-pompes.component.html',
  styleUrls: ['./gestion-pompes.component.css']
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

  constructor(private pompeService: PompePistoletService) {}

  ngOnInit(): void {
    this.loadPompes();
  }

  loadPompes(): void {
    this.loading = true;
    this.pompeService.getAllPompes().subscribe({
      next: (pompes) => {
        this.pompes = pompes;
        this.filterPompes();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pompes', err);
        this.loading = false;
      }
    });
  }

  filterPompes(): void {
    this.filteredPompes = this.pompes.filter(pompe =>
      (this.searchTerm === '' || pompe.numero_pompe.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (this.filterType === '' || pompe.type_pompe === this.filterType) &&
      (this.filterStatut === '' || pompe.statut === this.filterStatut)
    );
    this.currentPage = 1; // Reset à la première page après filtrage
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPompes.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPompes = this.filteredPompes.slice(startIndex, startIndex + this.itemsPerPage);
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
      'en_service': 'En Service',
      'hors_service_temporaire': 'Hors Service Temporaire',
      'reserve': 'Réserve',
      'maintenance': 'Maintenance',
      'hors_service_definitif': 'Hors Service Définitif'
    };
    return labels[statut] || statut;
  }

  openPistoletsModal(pompe: any): void {
    this.selectedPompe = { ...pompe };
    this.isPistoletsModalOpen = true;
    this.loadingPistolets = true;
    
    this.pompeService.getPistoletsByPompeId(pompe.id).subscribe({
      next: (pistolets) => {
        this.selectedPompe.pistolets = pistolets;
        this.loadingPistolets = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pistolets', err);
        this.loadingPistolets = false;
      }
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
    this.pompeService.updatePompe(this.selectedPompe.id, this.selectedPompe).subscribe({
      next: () => {
        this.loadPompes();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour', err);
      }
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
      error: (err) => {
        console.error('Erreur lors de la suppression', err);
      }
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
    this.pompeService.updateStatutPistolet(pistolet.id, pistolet.statut).subscribe({
      next: () => {
        console.log('Statut mis à jour avec succès');
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut', err);
        // Recharger les données pour revenir à l'état précédent
        if (this.isPistoletsModalOpen && this.selectedPompe) {
          this.openPistoletsModal(this.selectedPompe);
        }
      }
    });
  }
}