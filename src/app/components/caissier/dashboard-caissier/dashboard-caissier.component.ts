import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { GestionCreditsService } from '../../../services/gestion-credits.service';
import { GestionStockService } from '../../../services/gestion-stock.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-caissier',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './dashboard-caissier.component.html',
  styleUrls: ['./dashboard-caissier.component.css'],
})
export class DashboardCaissierComponent implements OnInit {
  @ViewChild('modeChart') modeChartRef!: ElementRef;
  @ViewChild('activityChart') activityChartRef!: ElementRef;

  currentUser: any = {};
  recentPayments: any[] = [];
  recentSales: any[] = [];
  stats: any = {
    total: 0,
    count: 0,
    by_mode: {},
  };
  salesStats: any = {
    total: 0,
    count: 0,
  };
  isLoading: boolean = true;
  showPaymentModal: boolean = false;
  showSaleModal: boolean = false;
  showAllPaymentsModal: boolean = false;
  showAllSalesModal: boolean = false;
  selectedPayment: any = null;
  selectedSale: any = null;
  modeChart: any;
  activityChart: any;
  filterForm: FormGroup;
  filterOptions = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'month', label: 'Ce mois' },
  ];

  constructor(
    private creditService: GestionCreditsService,
    private stockService: GestionStockService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      period: ['today'],
      startDate: [new Date()],
      endDate: [new Date()],
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.filterForm.get('period')?.valueChanges.subscribe(val => {
      this.applyFilter();
    });
  }

  loadUserData(): void {
    this.authService.getProfile().subscribe({
      next: data => {
        this.currentUser = Array.isArray(data) ? data[0][0] || data[0] : data;
        this.loadCaissierDashboard();
        this.loadSalesData();
      },
      error: err => {
        console.error('Erreur chargement profil:', err);
        this.isLoading = false;
      },
    });
  }

  loadCaissierDashboard(): void {
    this.creditService.getCaissierDashboard(this.currentUser.id).subscribe({
      next: response => {
        this.recentPayments = response.data.payments;
        this.stats = response.data.stats;
        this.initCharts();
      },
      error: err => {
        console.error('Erreur chargement dashboard:', err);
      },
    });
  }

  loadSalesData(): void {
    const period = this.filterForm.get('period')?.value;
    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'custom':
        startDate = this.filterForm.get('startDate')?.value;
        endDate = this.filterForm.get('endDate')?.value;
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    this.stockService
      .getVentesByCaissier(
        this.currentUser.id,
        startDate.toISOString(),
        endDate.toISOString()
      )
      .subscribe({
        next: ventes => {
          this.recentSales = ventes;
          this.calculateSalesStats();
          this.isLoading = false;
        },
        error: err => {
          console.error('Erreur chargement ventes:', err);
          this.isLoading = false;
        },
      });
  }

  calculateSalesStats(): void {
    // Convertir chaque montant en nombre avant de faire la somme
    this.salesStats.total = this.recentSales.reduce((sum, vente) => {
      // Convertir directement en nombre, en gérant les différents formats possibles
      let montant = 0;
      if (vente.montant_total !== null && vente.montant_total !== undefined) {
        // Si c'est déjà un nombre, l'utiliser directement
        if (typeof vente.montant_total === 'number') {
          montant = vente.montant_total;
        } else {
          // Si c'est une chaîne, la convertir proprement
          const montantStr = vente.montant_total.toString();
          // Remplacer la virgule par un point pour la conversion
          montant = parseFloat(montantStr.replace(',', '.'));
        }
      }
      return sum + (isNaN(montant) ? 0 : montant);
    }, 0);

    this.salesStats.count = this.recentSales.length;
    console.log('Stats calculées:', this.salesStats);
    console.log(
      'Ventes individuelles:',
      this.recentSales.map(v => ({
        ref: v.reference_vente,
        montant: v.montant_total,
        type: typeof v.montant_total,
      }))
    );
  }

  applyFilter(): void {
    this.isLoading = true;
    this.loadSalesData();
  }

  initCharts(): void {
    if (this.modeChart) this.modeChart.destroy();
    if (this.activityChart) this.activityChart.destroy();

    this.modeChart = new Chart(this.modeChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: Object.keys(this.stats.by_mode).map(mode =>
          this.getPaymentModeLabel(mode)
        ),
        datasets: [
          {
            data: Object.values(this.stats.by_mode),
            backgroundColor: ['#3498db', '#2ecc71', '#9b59b6', '#f39c12'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 20,
            },
          },
        },
        cutout: '70%',
      },
    });

    const activityData = this.generateActivityData();
    this.activityChart = new Chart(this.activityChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Transactions',
            data: activityData,
            fill: true,
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderColor: '#3498db',
            tension: 0.4,
            pointBackgroundColor: '#3498db',
            pointBorderColor: '#fff',
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              drawOnChartArea: true,
              drawTicks: false,
              lineWidth: 0,
            },
            border: {
              display: false,
            },
            ticks: {
              precision: 0,
            },
          },
          x: {
            grid: {
              drawOnChartArea: false,
              drawTicks: false,
            },
            border: {
              display: false,
            },
          },
        },
      },
    });
  }

  generateActivityData(): number[] {
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 10) + 1);
  }

  showPaymentDetails(payment: any): void {
    this.selectedPayment = payment;
    this.showPaymentModal = true;
  }

  showSaleDetails(sale: any): void {
    this.selectedSale = sale;
    this.showSaleModal = true;
  }

  closeModal(): void {
    this.showPaymentModal = false;
    this.showSaleModal = false;
    this.selectedPayment = null;
    this.selectedSale = null;
  }

  getPaymentModeLabel(mode: string): string {
    switch (mode) {
      case 'especes':
        return 'Espèces';
      case 'carte':
        return 'Carte';
      case 'virement':
        return 'Virement';
      case 'cheque':
        return 'Chèque';
      default:
        return mode;
    }
  }
}
