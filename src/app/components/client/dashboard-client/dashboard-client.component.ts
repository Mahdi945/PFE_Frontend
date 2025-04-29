import { Component, OnInit, inject } from '@angular/core';
import { GestionCreditsService } from '../../../services/gestion-credits.service';
import { AuthService } from '../../../services/auth.service';
import { Chart, ChartOptions, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

interface DashboardData {
  creditStats?: {
    credits_actifs: number;
    credits_expires: number;
    credits_rembourses: number;
    solde_restant: number;
    total_solde: number;
  };
  paymentStats?: {
    total_paye: number;
  };
  recentTransactions: any[];
  recentPayments: any[];
  vehicules: any[];
  credits: any[];
}

@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    FormsModule
  ],
  templateUrl: './dashboard-client.component.html',
  styleUrls: ['./dashboard-client.component.css']
})
export class DashboardClientComponent implements OnInit {
  private creditService = inject(GestionCreditsService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  dashboardData: DashboardData = {
    recentTransactions: [],
    recentPayments: [],
    vehicules: [],
    credits: []
  };
  recentTransactions: any[] = [];
  recentPayments: any[] = [];
  credits: any[] = [];
  user: any;
  isLoading = false;
  selectedCurrency: string = 'TND';
  exchangeRates: any = {
    'EUR': 0.3,  // 1 TND = 0.3 EUR (exemple)
    'USD': 0.33   // 1 TND = 0.33 USD (exemple)
  };

  private creditChart?: Chart;
  private paymentChart?: Chart;

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (data) => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.user = Array.isArray(data) ? data[0][0] || data[0] : data;
          this.loadDashboardData(this.user.id);
        } else {
          this.isLoading = false;
          this.toastr.error('Aucune donnée utilisateur trouvée');
        }
      },
      error: (err) => {
        console.error('Profile load error:', err);
        this.toastr.error('Erreur lors de la récupération du profil utilisateur');
        this.isLoading = false;
      }
    });
  }

  loadDashboardData(userId: number): void {
    this.creditService.getClientDashboard(userId).subscribe({
      next: (data: { data: DashboardData }) => {
        this.dashboardData = data.data;
        this.recentTransactions = this.dashboardData.recentTransactions;
        this.recentPayments = this.dashboardData.recentPayments;
        this.credits = this.dashboardData.credits;
        this.initCharts();
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error loading dashboard data:', err);
        this.toastr.error('Erreur lors du chargement des données du dashboard');
        this.isLoading = false;
      }
    });
  }

  onCurrencyChange(): void {
    this.updatePaymentChart();
  }

  convertCurrency(amount: number): number {
    if (this.selectedCurrency === 'TND') {
      return amount;
    }
    return amount * this.exchangeRates[this.selectedCurrency];
  }

  formatCurrency(value: number): string {
    if (this.selectedCurrency === 'TND') {
      return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(value);
    } else if (this.selectedCurrency === 'EUR') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(this.convertCurrency(value));
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.convertCurrency(value));
    }
  }

  getCurrencySymbol(): string {
    switch (this.selectedCurrency) {
      case 'EUR': return '€';
      case 'USD': return '$';
      default: return 'DT';
    }
  }

  private initCharts(): void {
    this.createCreditChart();
    this.createPaymentChart();
  }

  private createCreditChart(): void {
    const ctx = document.getElementById('creditChart') as HTMLCanvasElement;
    
    if (this.creditChart) {
      this.creditChart.destroy();
    }

    const data = {
      labels: ['Crédits Actifs', 'Crédits Expirés', 'Crédits Remboursés'],
      datasets: [{
        data: [
          this.dashboardData.creditStats?.credits_actifs || 0,
          this.dashboardData.creditStats?.credits_expires || 0,
          this.dashboardData.creditStats?.credits_rembourses || 0
        ],
        backgroundColor: ['#4e73df', '#e74a3b', '#1cc88a'],
        hoverBackgroundColor: ['#2e59d9', '#be2617', '#17a673'],
        hoverBorderColor: "rgba(234, 236, 244, 1)",
      }]
    };

    const options: ChartOptions<'doughnut'> = {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          backgroundColor: "rgb(255,255,255)",
          bodyColor: "#858796",
          borderColor: '#dddfeb',
          borderWidth: 1,
          padding: 15,
          displayColors: true,
          callbacks: {
            label: (context) => `${context.label}: ${context.raw}`
          }
        }
      },
      cutout: '70%'
    };

    this.creditChart = new Chart(ctx, {
      type: 'doughnut',
      data,
      options
    });
  }

  private createPaymentChart(): void {
    const ctx = document.getElementById('paymentChart') as HTMLCanvasElement;
    
    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    const data = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [{
        label: `Paiements (${this.getCurrencySymbol()})`,
        backgroundColor: '#4e73df',
        hoverBackgroundColor: '#2e59d9',
        borderColor: '#4e73df',
        data: [4215, 5312, 6251, 7841, 9821, 14984, 4215, 5312, 6251, 7841, 9821, 14984]
          .slice(0, new Date().getMonth() + 1)
          .map(amount => this.convertCurrency(amount))
      }]
    };

    const options: ChartOptions<'bar'> = {
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 6 }
        },
        y: {
          ticks: {
            callback: (value) => `${value} ${this.getCurrencySymbol()}`,
            maxTicksLimit: 5
          },
          grid: {
            color: "rgb(234, 236, 244)",
            drawBorder: false,
            drawTicks: false,
            lineWidth: 1
          } as any
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw} ${this.getCurrencySymbol()}`
          }
        }
      }
    };

    this.paymentChart = new Chart(ctx, {
      type: 'bar',
      data,
      options
    });
  }

  private updatePaymentChart(): void {
    if (this.paymentChart) {
      this.paymentChart.data.datasets[0].label = `Paiements (${this.getCurrencySymbol()})`;
      this.paymentChart.data.datasets[0].data = [4215, 5312, 6251, 7841, 9821, 14984, 4215, 5312, 6251, 7841, 9821, 14984]
        .slice(0, new Date().getMonth() + 1)
        .map(amount => this.convertCurrency(amount));
      
      if (this.paymentChart.options.scales?.['y']) {
        (this.paymentChart.options.scales['y'].ticks as any).callback = (value: number) => 
          `${value} ${this.getCurrencySymbol()}`;
      }

      if (this.paymentChart.options.plugins?.tooltip?.callbacks) {
        this.paymentChart.options.plugins.tooltip.callbacks.label = (context) => 
          `${context.raw} ${this.getCurrencySymbol()}`;
      }

      this.paymentChart.update();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }
}