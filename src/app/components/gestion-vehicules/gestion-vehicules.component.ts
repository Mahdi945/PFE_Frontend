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
  selector: 'app-gestion-vehicules',
  standalone: true,
  imports: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
  ],
  templateUrl: './gestion-vehicules.component.html',
  styleUrls: ['./gestion-vehicules.component.css'],
})
export class GestionVehiculesComponent implements OnInit {
  vehicules: any[] = [];
  filteredVehicules: any[] = [];
  creditsDisponibles: any[] = [];
  selectedVehicule: any = {
    id: null,
    id_credit: null,
    immatriculation: '',
    marque: '',
    type_vehicule: 'voiture',
  };
  searchTerm: string = '';
  searchCreditId: string = '';
  selectedType: string = '';
  selectedEtatCredit: string = '';
  isModalOpen: boolean = false;
  isQrCodeModalOpen: boolean = false;
  isRenewModalOpen: boolean = false;
  selectedQrCode: string = '';
  creditSearchTerm: string = '';
  showCreditDropdown: boolean = false;
  filteredCredits: any[] = [];

  // Nouvelles propriétés pour les modales modernes
  showDetailsModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  successMessage: string = '';
  errorModalMessage: string = '';
  isLoading: boolean = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  constructor(private gestionCreditsService: GestionCreditsService) {}

  ngOnInit(): void {
    this.fetchAllVehicules();
    this.fetchCreditsActifs();
  }
  fetchAllVehicules(): void {
    this.isLoading = true;
    this.gestionCreditsService.getAllVehicules().subscribe({
      next: (response: any) => {
        let vehiculesData = [];

        if (Array.isArray(response)) {
          vehiculesData = response;
        } else if (response && Array.isArray(response.data)) {
          vehiculesData = response.data;
        } else if (response && response.success && Array.isArray(response.data)) {
          vehiculesData = response.data;
        }

        this.vehicules = vehiculesData.map((v: any) => ({
          ...v,
          username: v.username || 'N/A',
          immatriculation: v.immatriculation || 'N/A',
          marque: v.marque || 'N/A',
          type_vehicule: v.type_vehicule || 'N/A',
          id_credit: v.id_credit || 'N/A',
          credit_etat: v.credit_etat || 'N/A',
          qr_code: v.qr_code || null,
        }));

        this.filteredVehicules = [...this.vehicules].sort((a, b) => b.id - a.id);
        this.calculateTotalPages();
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur de chargement des véhicules', error);
        this.vehicules = [];
        this.filteredVehicules = [];
        this.calculateTotalPages();
        this.isLoading = false;
      },
    });
  }

  fetchCreditsActifs(): void {
    this.gestionCreditsService.getAllCredits().subscribe({
      next: (credits: any) => {
        this.creditsDisponibles = Array.isArray(credits)
          ? credits.filter((credit: any) => credit.etat === 'actif')
          : [];
        this.filteredCredits = [...this.creditsDisponibles];
      },
      error: error => {
        console.error('Erreur lors du chargement des crédits', error);
        this.creditsDisponibles = [];
        this.filteredCredits = [];
      },
    });
  }
  filterVehicules(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const creditId = this.searchCreditId ? Number(this.searchCreditId) : null;

    this.filteredVehicules = this.vehicules
      .filter((vehicule: any) => {
        const matchTerm =
          term === '' ||
          vehicule.immatriculation?.toLowerCase().includes(term) ||
          vehicule.username?.toLowerCase().includes(term);

        const matchCreditId = creditId === null || vehicule.id_credit === creditId;
        const matchType =
          this.selectedType === '' || vehicule.type_vehicule === this.selectedType;
        const matchEtatCredit =
          this.selectedEtatCredit === '' ||
          vehicule.credit_etat === this.selectedEtatCredit;

        return matchTerm && matchCreditId && matchType && matchEtatCredit;
      })
      .sort((a, b) => b.id - a.id); // Tri par ordre décroissant

    this.calculateTotalPages();
    this.currentPage = 1;
  }

  filterCreditList(event: any): void {
    const term = event.target.value.toLowerCase().trim();
    this.creditSearchTerm = term;
    this.showCreditDropdown = term.length > 0;

    if (term.length > 0) {
      this.filteredCredits = this.creditsDisponibles.filter(
        credit =>
          credit.id.toString().includes(term) ||
          credit.utilisateur?.toLowerCase().includes(term)
      );
    } else {
      this.filteredCredits = [...this.creditsDisponibles];
    }
  }

  selectCredit(credit: any): void {
    this.selectedVehicule.id_credit = credit.id;
    this.creditSearchTerm = `#${credit.id} - ${credit.utilisateur || 'N/A'}`;
    this.showCreditDropdown = false;
  }

  calculateTotalPages(): void {
    this.totalPages =
      Math.ceil(this.filteredVehicules.length / this.itemsPerPage) || 1;
  }

  paginatedVehicules(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredVehicules.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  viewQrCode(qrCodeUrl: string): void {
    this.selectedQrCode = qrCodeUrl;
    this.isQrCodeModalOpen = true;
  }
  printQrCodeFromElement(qrCodeElement: HTMLImageElement, vehicule?: any) {
    const printWindow = window.open('', '_blank', 'width=800,height=800');

    if (printWindow) {
      const qrCodeSrc = qrCodeElement.src;

      const style = `
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', sans-serif;
            background: #f0f4f8;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
  
          .header {
            font-size: 36px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 30px;
          }

          .vehicule-info {
            font-size: 18px;
            color: #4a5568;
            margin-bottom: 20px;
            text-align: center;
          }
  
          .qr-wrapper {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
          }
  
          .qr-wrapper img {
            width: 400px;
            height: 400px;
          }
        </style>
      `;

      let vehiculeInfoHtml = '';
      if (vehicule) {
        vehiculeInfoHtml = `
          <div class="vehicule-info">
            <strong>Propriétaire:</strong> ${vehicule.username}<br>
            <strong>Immatriculation:</strong> ${vehicule.immatriculation}<br>
            <strong>Véhicule:</strong> ${vehicule.marque} - ${vehicule.type_vehicule}
          </div>
        `;
      }

      const html = `
        <html>
          <head>
            <title>Impression QR Code - CarboTrack</title>
            ${style}
          </head>
          <body>
            <div class="header">CarboTrack</div>
            ${vehiculeInfoHtml}
            <div class="qr-wrapper">
              <img src="${qrCodeSrc}" alt="QR Code">
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  }

  closeQrCodeModal(): void {
    this.isQrCodeModalOpen = false;
  }

  openAddModal(): void {
    this.selectedVehicule = {
      id: null,
      id_credit: null,
      immatriculation: '',
      marque: '',
      type_vehicule: 'voiture',
    };
    this.creditSearchTerm = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  openRenewModal(vehicule: any): void {
    this.selectedVehicule = { ...vehicule };
    this.isRenewModalOpen = true;
  }

  closeRenewModal(): void {
    this.isRenewModalOpen = false;
  }
  renewVehicule(): void {
    if (!this.selectedVehicule.id_credit) {
      this.showError('Veuillez sélectionner un nouveau crédit');
      return;
    }

    const updateData = {
      id: this.selectedVehicule.id,
      id_credit: this.selectedVehicule.id_credit, // Seul l'ID du crédit est changé
    };

    this.gestionCreditsService.updateVehicule(updateData).subscribe({
      next: (response: any) => {
        this.fetchAllVehicules();
        this.closeRenewModal();
        this.showSuccess('Véhicule renouvelé avec succès !');
      },
      error: error => {
        console.error('Erreur lors du renouvellement du crédit', error);
        this.showError(
          `Erreur: ${error.error?.message || 'Une erreur est survenue'}`
        );
      },
    });
  }
  addVehicule(): void {
    if (!this.selectedVehicule.id_credit) {
      this.showError('Veuillez sélectionner un crédit');
      return;
    }

    this.gestionCreditsService.addVehicule(this.selectedVehicule).subscribe({
      next: (response: any) => {
        this.fetchAllVehicules();
        this.closeModal();
        this.showSuccess('Véhicule ajouté avec succès !');
      },
      error: error => {
        console.error("Erreur lors de l'ajout du véhicule", error);
        this.showError(
          `Erreur: ${error.error?.message || 'Une erreur est survenue'}`
        );
      },
    });
  }

  // Nouvelles méthodes pour les modales modernes
  showVehiculeDetails(vehicule: any): void {
    this.selectedVehicule = { ...vehicule };
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
  }

  showError(message: string): void {
    this.errorModalMessage = message;
    this.showErrorModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorModalMessage = '';
  }

  onModalOverlayClick(event: Event): void {
    // Empêche la fermeture accidentelle lors du clic sur le contenu de la modale
    event.stopPropagation();
  }
  // Méthodes pour les icônes et badges
  getTypeIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'voiture':
        return 'bi bi-car-front-fill';
      case 'camion':
        return 'bi bi-truck';
      case 'bus':
        return 'bi bi-bus-front';
      case 'moto':
        return 'bi bi-bicycle';
      default:
        return 'bi bi-car-front';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'voiture':
        return 'bg-primary text-white';
      case 'camion':
        return 'bg-warning text-dark';
      case 'bus':
        return 'bg-info text-white';
      case 'moto':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  getBadgeClass(etat: string): string {
    switch (etat?.toLowerCase()) {
      case 'actif':
        return 'bg-success text-white';
      case 'expiré':
        return 'bg-warning text-dark';
      case 'annulé':
        return 'bg-danger text-white';
      case 'remboursé':
        return 'bg-primary text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  getEtatIcon(etat: string): string {
    switch (etat?.toLowerCase()) {
      case 'actif':
        return 'bi bi-check-circle';
      case 'expiré':
        return 'bi bi-exclamation-circle';
      case 'annulé':
        return 'bi bi-x-circle';
      case 'remboursé':
        return 'bi bi-cash-coin';
      default:
        return 'bi bi-question-circle';
    }
  }

  // Méthode pour imprimer le QR code depuis le modal de détails
  printQrCode(): void {
    if (!this.selectedVehicule?.qr_code) {
      this.showError('Aucun QR code disponible pour ce véhicule');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=800');

    if (printWindow) {
      const qrCodeSrc = this.selectedVehicule.qr_code;

      const style = `
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', sans-serif;
            background: #f0f4f8;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
  
          .header {
            font-size: 36px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 30px;
          }
  
          .vehicule-info {
            font-size: 18px;
            color: #4a5568;
            margin-bottom: 20px;
            text-align: center;
          }
  
          .qr-wrapper {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
          }
  
          .qr-wrapper img {
            width: 400px;
            height: 400px;
          }
        </style>
      `;

      const html = `
        <html>
          <head>
            <title>QR Code - ${this.selectedVehicule.immatriculation}</title>
            ${style}
          </head>
          <body>
            <div class="header">CarboTrack</div>            <div class="vehicule-info">
              <strong>Propriétaire:</strong> ${this.selectedVehicule.username}<br>
              <strong>Immatriculation:</strong> ${this.selectedVehicule.immatriculation}<br>
              <strong>Véhicule:</strong> ${this.selectedVehicule.marque} - ${this.selectedVehicule.type_vehicule}
            </div>
            <div class="qr-wrapper">
              <img src="${qrCodeSrc}" alt="QR Code">
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  }
  // Method to handle QR code printing from click event
  onQrCodeClick(event: Event, vehicule?: any): void {
    const img = event.target as HTMLImageElement;
    this.printQrCodeFromElement(img, vehicule);
  }
}
