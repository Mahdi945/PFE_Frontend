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
  imports: [NavbarComponent, SidebarComponent, CommonModule, FooterComponent, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './gestion-credits.component.html',
  styleUrls: ['./gestion-credits.component.css']
})
export class GestionCreditsComponent implements OnInit {
  credits: any[] = []; // Liste complète des crédits
  filteredCredits: any[] = []; // Liste filtrée des crédits
  searchTerm: string = ''; // Terme de recherche (nom ou ID crédit)
  selectedType: string = ''; // Filtre par type de crédit
  selectedEtat: string = ''; // Filtre par état
  currentPage: number = 1; // Page actuelle pour la pagination
  pageSize: number = 10; // Nombre d'éléments par page
  totalPages: number = 1; // Nombre total de pages

  // Variables pour la gestion des crédits
  selectedCredit: any = {}; // Crédit sélectionné pour l'ajout
  isModalOpen: boolean = false; // État du modal d'ajout
  errorMessage: string = ''; // Message d'erreur

  constructor(private GestionCreditsService: GestionCreditsService) {}

  ngOnInit(): void {
    this.fetchCredits(); // Charger les crédits au démarrage
  }

  // Récupérer tous les crédits depuis le service
  fetchCredits(): void {
    this.GestionCreditsService.getAllCredits().subscribe(
      (data) => {
        this.credits = data;
        this.totalPages = Math.ceil(this.credits.length / this.pageSize);
        this.updateFilteredCredits(); // Mettre à jour la liste filtrée
      },
      (error) => {
        console.error('Erreur lors du chargement des crédits', error);
      }
    );
  }

  // Mettre à jour la liste filtrée des crédits
  updateFilteredCredits(): void {
    this.filteredCredits = this.credits
      .filter(credit => {
        // Filtre par nom ou ID crédit
        const matchesSearchTerm = this.searchTerm === '' ||
          credit.utilisateur.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          credit.id === parseInt(this.searchTerm);

        // Filtre par type de crédit
        const matchesType = this.selectedType === '' || credit.type_credit === this.selectedType;

        // Filtre par état
        const matchesEtat = this.selectedEtat === '' || credit.etat === this.selectedEtat;

        return matchesSearchTerm && matchesType && matchesEtat;
      })
      .slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); // Gestion de la pagination
  }

  // Filtrer les crédits en fonction des critères
  filterCredits(): void {
    this.currentPage = 1; // Réinitialiser à la première page
    this.updateFilteredCredits();
  }

  // Ouvrir le modal d'ajout de crédit
  openAddModal(): void {
    this.isModalOpen = true;
  }

  // Fermer le modal d'ajout de crédit
  closeModal(): void {
    this.isModalOpen = false;
    this.errorMessage = ''; // Réinitialiser le message d'erreur
  }

  // Ajouter un crédit
  addCredit(): void {
    this.GestionCreditsService.addCredit(this.selectedCredit).subscribe(
      (response) => {
        console.log('Crédit ajouté avec succès', response);
        this.fetchCredits(); // Récupérer les crédits après l'ajout
        this.closeModal();
      },
      (error) => {
        // Gérer les erreurs lors de l'ajout
        if (error.status === 404) {
          this.errorMessage = 'Client non trouvé.';
        } else {
          console.error('Erreur lors de l\'ajout du crédit', error);
          this.errorMessage = 'Une erreur s\'est produite. Veuillez réessayer plus tard.';
        }
      }
    );
  }

  // Changer de page pour la pagination
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateFilteredCredits();
    }
  }

  // Changer la taille de la page (nombre d'éléments par page)
  changePageSize(): void {
    const parsedSize = parseInt(this.pageSize.toString(), 10);
    if (!isNaN(parsedSize) && parsedSize > 0) {
      this.pageSize = parsedSize;
      this.totalPages = Math.ceil(this.credits.length / this.pageSize);
      this.currentPage = 1;
      this.updateFilteredCredits();
    }
  }
}