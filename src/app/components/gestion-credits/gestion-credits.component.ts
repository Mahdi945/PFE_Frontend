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
  credits: any[] = [];
  filteredCredits: any[] = [];
  searchTerm: string = '';
  selectedType: string = '';
  selectedEtat: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Variables pour les modals
  selectedCredit: any = {};
  isModalOpen: boolean = false;
  isRenewModalOpen: boolean = false;
  errorMessage: string = '';
  
  // Variables pour l'autocomplétion
  clients: any[] = [];
  filteredClients: any[] = [];
  showClientDropdown: boolean = false;
  clientSearchTerm: string = '';

  constructor(private gestionCreditsService: GestionCreditsService) {}

  ngOnInit(): void {
    this.fetchCredits();
    this.fetchClients();
  }

  fetchClients(): void {
    this.gestionCreditsService.getAllUsers().subscribe(
      (data: any) => {
        this.clients = data.filter((user: any) => user.role === 'client');
      },
      (error) => {
        console.error('Erreur lors du chargement des clients', error);
      }
    );
  }

  fetchCredits(): void {
    this.gestionCreditsService.getAllCredits().subscribe(
      (data) => {
        this.credits = data;
        this.totalPages = Math.ceil(this.credits.length / this.pageSize);
        this.updateFilteredCredits();
      },
      (error) => {
        console.error('Erreur lors du chargement des crédits', error);
      }
    );
  }

  updateFilteredCredits(): void {
    this.filteredCredits = this.credits
      .filter(credit => {
        const matchesSearchTerm = this.searchTerm === '' ||
          credit.utilisateur.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          credit.id === parseInt(this.searchTerm);
        const matchesType = this.selectedType === '' || credit.type_credit === this.selectedType;
        const matchesEtat = this.selectedEtat === '' || credit.etat === this.selectedEtat;
        return matchesSearchTerm && matchesType && matchesEtat;
      })
      .slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  filterCredits(): void {
    this.currentPage = 1;
    this.updateFilteredCredits();
  }

  // Gestion de l'autocomplétion des clients
  filterClientList(event: any): void {
    this.clientSearchTerm = event.target.value;
    if (this.clientSearchTerm.length > 0) {
      this.filteredClients = this.clients.filter(client =>
        client.username.toLowerCase().includes(this.clientSearchTerm.toLowerCase())
      );
      this.showClientDropdown = this.filteredClients.length > 0;
    } else {
      this.filteredClients = [];
      this.showClientDropdown = false;
    }
  }

  selectClient(client: any): void {
    this.selectedCredit.utilisateur = client.username;
    this.clientSearchTerm = client.username;
    this.showClientDropdown = false;
  }

  // Modal d'ajout
  openAddModal(): void {
    this.selectedCredit = {};
    this.clientSearchTerm = '';
    this.filteredClients = [];
    this.showClientDropdown = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.errorMessage = '';
    this.clientSearchTerm = '';
    this.filteredClients = [];
    this.showClientDropdown = false;
  }

 // Modal de renouvellement
 openRenewModal(credit: any): void {
  if (credit.etat !== 'remboursé' && credit.etat !== 'expiré') {
    alert('Seuls les crédits remboursés ou expirés peuvent être renouvelés');
    return;
  }
  
  
  this.selectedCredit = {
    id: credit.id,
    utilisateur: credit.utilisateur,
    type_credit: credit.type_credit,
    solde_credit: credit.solde_credit,
    duree_credit: credit.duree_credit,
    date_debut: new Date().toISOString().split('T')[0] // Date du jour par défaut
  };
  this.isRenewModalOpen = true;
}
  closeRenewModal(): void {
    this.isRenewModalOpen = false;
    this.errorMessage = '';
  }

  addCredit(): void {
    // Vérifier que le nom du client correspond à un client existant
    const selectedClient = this.clients.find(c => c.username === this.selectedCredit.utilisateur);
    if (!selectedClient) {
      this.errorMessage = 'Veuillez sélectionner un client valide dans la liste';
      return;
    }

    this.gestionCreditsService.addCredit(this.selectedCredit).subscribe(
      (response) => {
        console.log('Crédit ajouté avec succès', response);
        this.fetchCredits();
        this.closeModal();
      },
      (error) => {
        if (error.status === 404) {
          this.errorMessage = 'Client non trouvé.';
        } else {
          console.error('Erreur lors de l\'ajout du crédit', error);
          this.errorMessage = 'Une erreur s\'est produite. Veuillez réessayer plus tard.';
        }
      }
    );
  }

  renewCredit(): void {
    this.gestionCreditsService.renewCredit({
      id_credit: this.selectedCredit.id,
      solde_credit: this.selectedCredit.solde_credit,
      date_debut: this.selectedCredit.date_debut,
      duree_credit: this.selectedCredit.duree_credit
    }).subscribe(
      (response) => {
        console.log('Crédit renouvelé avec succès', response);
        this.fetchCredits();
        this.closeRenewModal();
      },
      (error) => {
        console.error('Erreur lors du renouvellement du crédit', error);
        this.errorMessage = error.error?.error || 'Une erreur s\'est produite. Veuillez réessayer plus tard.';
      }
    );
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateFilteredCredits();
    }
  }

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