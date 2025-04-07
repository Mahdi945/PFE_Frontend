import { Component, OnInit } from '@angular/core';
import { PompePistoletService } from '../../../services/pompes-pistolets.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-gestion-pompes',
  standalone: true,
  imports: [NavbarComponent, SidebarComponent, FooterComponent, CommonModule, FormsModule],
  templateUrl: './gestion-pompes.component.html',
  styleUrls: ['./gestion-pompes.component.css']
})
export class GestionPompesComponent implements OnInit {
  pompes: any[] = [];
  filteredPompes: any[] = [];
  selectedPompe: any = null;
  isModalOpen: boolean = false;
  showActions: boolean = false;
  searchTerm: string = '';
  filterType: string = '';
  filterStatut: string = '';

  constructor(private pompeService: PompePistoletService) {}

  ngOnInit(): void {
    this.fetchPompes();
  }

  fetchPompes(): void {
    this.pompeService.getAllPompes().subscribe({
      next: (data) => {
        this.pompes = data;
        this.filterPompes();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pompes', err);
      }
    });
  }

  filterPompes(): void {
    this.filteredPompes = this.pompes.filter(pompe => 
      (this.searchTerm === '' || pompe.numero_pompe.includes(this.searchTerm)) &&
      (this.filterType === '' || pompe.type_pompe === this.filterType) &&
      (this.filterStatut === '' || pompe.statut === this.filterStatut)
    );
  }

  toggleActions(pompe: any): void {
    if (this.selectedPompe?.id === pompe.id) {
      this.showActions = !this.showActions;
    } else {
      this.selectedPompe = pompe;
      this.showActions = true;
    }
  }

  openModal(pompe: any): void {
    this.selectedPompe = { ...pompe };
    this.isModalOpen = true;
    this.showActions = false;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedPompe = null;
  }

  updatePompe(): void {
    if (!this.selectedPompe) return;
    this.pompeService.updatePompe(this.selectedPompe.id, this.selectedPompe).subscribe({
      next: () => {
        this.fetchPompes();
        this.closeModal();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour', err);
      }
    });
  }

  deletePompe(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cette pompe ?')) {
      this.pompeService.deletePompe(id).subscribe({
        next: () => {
          this.fetchPompes();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
        }
      });
    }
  }
}
