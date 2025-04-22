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
  selectedVehicule: any = {};
  searchTerm: string = '';
  searchCreditId: string = '';
  selectedType: string = '';
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
  }

  fetchAllVehicules(): void {
    this.gestionCreditsService.getAllVehicules().subscribe(
      (data) => {
        this.vehicules = data;
        this.filterVehicules();
      },
      (error) => {
        console.error('❌ Erreur de chargement des véhicules', error);
        this.filteredVehicules = [];
      }
    );
  }
  filterVehicules(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const creditId = this.searchCreditId ? Number(this.searchCreditId) : null;
  
    this.filteredVehicules = this.vehicules.filter((vehicule) => {
      // Recherche par terme (immatriculation ou username)
      const matchTerm =
        term === '' ||
        vehicule.immatriculation?.toLowerCase().includes(term) ||
        vehicule.username?.toLowerCase().includes(term);
  
      // Recherche exacte par ID crédit (en tant que nombre)
      const matchCreditId = creditId === null || vehicule.id_credit === creditId;
  
      // Filtre par type
      const matchType = this.selectedType === '' || vehicule.type_vehicule === this.selectedType;
  
      return matchTerm && matchCreditId && matchType;
    });
  
    // Réinitialiser la pagination après le filtrage
    this.totalPages = Math.ceil(this.filteredVehicules.length / this.itemsPerPage);
    this.currentPage = 1;
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
    this.selectedVehicule = {};
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  addVehicule(): void {
    this.gestionCreditsService.addVehicule(this.selectedVehicule).subscribe(
      (response) => {
        this.vehicules.push(response.vehicule);
        this.fetchAllVehicules();
        this.closeModal();
      },
      (error) => {
        console.error('Erreur lors de l\'ajout du véhicule', error);
      }
    );
  }
}
