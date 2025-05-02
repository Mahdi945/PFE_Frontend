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
    RouterModule
  ],
  templateUrl: './gestion-vehicules.component.html',
  styleUrls: ['./gestion-vehicules.component.css']
})
export class GestionVehiculesComponent implements OnInit {
  vehicules: any[] = [];
  filteredVehicules: any[] = [];
  creditsDisponibles: any[] = [];
  selectedVehicule: any = {
    id_credit: null,
    immatriculation: '',
    marque: '',
    type_vehicule: 'voiture'
  };
  searchTerm: string = '';
  searchCreditId: string = '';
  selectedType: string = '';
  selectedEtatCredit: string = '';
  isModalOpen: boolean = false;
  isQrCodeModalOpen: boolean = false;
  selectedQrCode: string = '';

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
          credit_etat: v.credit_etat || 'N/A', // Ajout de l'état du crédit
          qr_code: v.qr_code || null
        }));
        
        this.filteredVehicules = [...this.vehicules];
        this.calculateTotalPages();
        
        console.log('Données des véhicules:', this.vehicules); // Pour débogage
      },
      error: (error) => {
        console.error('Erreur de chargement des véhicules', error);
        this.vehicules = [];
        this.filteredVehicules = [];
        this.calculateTotalPages();
      }
    });
  }

  fetchCreditsActifs(): void {
    this.gestionCreditsService.getAllCredits().subscribe({
      next: (credits: any) => {
        this.creditsDisponibles = Array.isArray(credits) 
          ? credits.filter((credit: any) => credit.etat === 'actif')
          : [];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des crédits', error);
        this.creditsDisponibles = [];
      }
    });
  }

  filterVehicules(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const creditId = this.searchCreditId ? Number(this.searchCreditId) : null;
  
    this.filteredVehicules = this.vehicules.filter((vehicule: any) => {
      const matchTerm =
        term === '' ||
        (vehicule.immatriculation?.toLowerCase().includes(term)) ||
        (vehicule.username?.toLowerCase().includes(term));
      
      const matchCreditId = creditId === null || vehicule.id_credit === creditId;
      const matchType = this.selectedType === '' || vehicule.type_vehicule === this.selectedType;
      const matchEtatCredit = this.selectedEtatCredit === '' || vehicule.credit_etat === this.selectedEtatCredit;
      
      return matchTerm && matchCreditId && matchType && matchEtatCredit;
    });
  
    this.calculateTotalPages();
    this.currentPage = 1;
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredVehicules.length / this.itemsPerPage) || 1;
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

  printQrCode(qrCodeElement: HTMLImageElement) {
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
            <title>Impression QR Code - CarboTrack</title>
            ${style}
          </head>
          <body>
            <div class="header">CarboTrack</div>
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
      id_credit: null,
      immatriculation: '',
      marque: '',
      type_vehicule: 'voiture'
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  addVehicule(): void {
    if (!this.selectedVehicule.id_credit) {
      alert('Veuillez sélectionner un crédit');
      return;
    }

    this.gestionCreditsService.addVehicule(this.selectedVehicule).subscribe({
      next: (response: any) => {
        this.fetchAllVehicules();
        this.closeModal();
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du véhicule', error);
        alert(`Erreur: ${error.error?.message || 'Une erreur est survenue'}`);
      }
    });
  }
}