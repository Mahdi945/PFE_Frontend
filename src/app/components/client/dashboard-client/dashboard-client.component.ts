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
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

interface DashboardData {
  creditStats?: {
    credits_actifs: number;
    credits_expires: number;
    credits_annules: number;
    credits_rembourses: number;
    solde_restant: number;
    total_solde: number;
    total_credits?: number;
    total_utilise?: number;
    total_paye_actifs?: number;
    total_vehicules?: number;
  };
  paymentStats?: {
    total_paye: number;
    nombre_paiements?: number;
    monthlyPayments?: { month: number; amount: number }[];
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
    FormsModule,
  ],
  templateUrl: './dashboard-client.component.html',
  styleUrls: ['./dashboard-client.component.css'],
})
export class DashboardClientComponent implements OnInit {
  private creditService = inject(GestionCreditsService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  currentYear: number = new Date().getFullYear();
  dashboardData: DashboardData = {
    recentTransactions: [],
    recentPayments: [],
    vehicules: [],
    credits: [],
  };
  isLoading = false;
  selectedCurrency: string = 'TND';
  exchangeRates: any = {
    EUR: 0.3,
    USD: 0.33,
  };

  private creditChart?: Chart;
  private paymentChart?: Chart;

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (response: any) => {
        if (!response) {
          throw new Error('Réponse vide du serveur');
        }

        const data = Array.isArray(response)
          ? response[0] && response[0][0]
            ? response[0][0]
            : response[0]
          : response;

        if (!data || !data.id) {
          throw new Error('Données utilisateur invalides');
        }

        this.loadDashboardData(data.id);
      },
      error: err => {
        console.error('Profile load error:', err);
        this.toastr.error('Erreur lors de la récupération du profil utilisateur');
        this.isLoading = false;
      },
    });
  }

  loadDashboardData(userId: number): void {
    this.isLoading = true;

    forkJoin([
      this.creditService.getClientDashboard(userId),
      this.loadMonthlyPayments(userId),
    ]).subscribe({
      next: ([dashboardResponse, monthlyPayments]) => {
        if (!dashboardResponse.success) {
          throw new Error(dashboardResponse.message || 'Erreur inconnue');
        }

        // Calcul du total payé pour les crédits actifs
        const activeCreditsPayments = (dashboardResponse.data.credits || [])
          .filter((c: any) => c.etat === 'actif')
          .reduce((sum: number, credit: any) => sum + (credit.total_paye || 0), 0);

        this.dashboardData = {
          ...dashboardResponse.data,
          creditStats: {
            ...dashboardResponse.data.creditStats,
            total_paye_actifs: activeCreditsPayments,
          },
          paymentStats: {
            ...dashboardResponse.data.paymentStats,
            monthlyPayments: monthlyPayments,
          },
        };

        this.initCharts();
        this.isLoading = false;
      },
      error: err => {
        console.error('Error loading dashboard data:', err);
        this.toastr.error('Erreur lors du chargement des données du dashboard');
        this.isLoading = false;

        this.dashboardData = {
          creditStats: {
            credits_actifs: 0,
            credits_expires: 0,
            credits_annules: 0,
            credits_rembourses: 0,
            solde_restant: 0,
            total_solde: 0,
            total_paye_actifs: 0,
            total_vehicules: 0,
          },
          paymentStats: {
            total_paye: 0,
            nombre_paiements: 0,
            monthlyPayments: [],
          },
          recentTransactions: [],
          recentPayments: [],
          vehicules: [],
          credits: [],
        };
      },
    });
  }

  private async loadMonthlyPayments(
    userId: number
  ): Promise<{ month: number; amount: number }[]> {
    try {
      const response: any = await this.creditService
        .getMonthlyPayments(userId)
        .toPromise();
      return response.data || [];
    } catch (err) {
      console.error('Error loading monthly payments:', err);
      return [];
    }
  }

  onCurrencyChange(): void {
    this.updatePaymentChart();
  }

  convertCurrency(amount: number): number {
    if (!amount) return 0;
    if (this.selectedCurrency === 'TND') {
      return amount;
    }
    return amount * (this.exchangeRates[this.selectedCurrency] || 1);
  }

  formatCurrency(value: number): string {
    const amount = this.convertCurrency(value || 0);
    if (this.selectedCurrency === 'TND') {
      return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
      }).format(amount);
    } else if (this.selectedCurrency === 'EUR') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  }

  getCurrencySymbol(): string {
    switch (this.selectedCurrency) {
      case 'EUR':
        return '€';
      case 'USD':
        return '$';
      default:
        return 'DT';
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

    const creditStats = this.dashboardData.creditStats || {
      credits_actifs: 0,
      credits_expires: 0,
      credits_annules: 0,
      credits_rembourses: 0,
    };

    const data = {
      labels: ['Actifs', 'Expirés', 'Annulés', 'Remboursés'],
      datasets: [
        {
          data: [
            creditStats.credits_actifs || 0,
            creditStats.credits_expires || 0,
            creditStats.credits_annules || 0,
            creditStats.credits_rembourses || 0,
          ],
          backgroundColor: ['#4e73df', '#e74a3b', '#f6c23e', '#1cc88a'],
          hoverBackgroundColor: ['#2e59d9', '#be2617', '#dda20a', '#17a673'],
          hoverBorderColor: 'rgba(234, 236, 244, 1)',
        },
      ],
    };

    const options: ChartOptions<'doughnut'> = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 14,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgb(255,255,255)',
          bodyColor: '#858796',
          borderColor: '#dddfeb',
          borderWidth: 1,
          padding: 15,
          displayColors: true,
          callbacks: {
            label: context => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.raw as number;
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      cutout: '70%',
    };

    this.creditChart = new Chart(ctx, {
      type: 'doughnut',
      data,
      options,
    });
  }

  private createPaymentChart(): void {
    const ctx = document.getElementById('paymentChart') as HTMLCanvasElement;

    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    // Préparer les données mensuelles
    const monthlyData = Array(12).fill(0);
    (this.dashboardData.paymentStats?.monthlyPayments || []).forEach(item => {
      monthlyData[item.month - 1] = item.amount;
    });

    const data = {
      labels: [
        'Jan',
        'Fév',
        'Mar',
        'Avr',
        'Mai',
        'Jun',
        'Jul',
        'Aoû',
        'Sep',
        'Oct',
        'Nov',
        'Déc',
      ],
      datasets: [
        {
          label: `Paiements (${this.getCurrencySymbol()})`,
          backgroundColor: '#4e73df',
          hoverBackgroundColor: '#2e59d9',
          borderColor: '#4e73df',
          data: monthlyData.map(amount => this.convertCurrency(amount)),
        },
      ],
    };

    const options: ChartOptions<'bar'> = {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 6 },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `${value} ${this.getCurrencySymbol()}`,
            maxTicksLimit: 5,
          },
          grid: {
            color: 'rgb(234, 236, 244)',
            drawTicks: false,
            lineWidth: 1,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${context.raw} ${this.getCurrencySymbol()}`,
          },
        },
      },
    };

    this.paymentChart = new Chart(ctx, {
      type: 'bar',
      data,
      options,
    });
  }

  private updatePaymentChart(): void {
    if (this.paymentChart) {
      this.paymentChart.data.datasets[0].label = `Paiements (${this.getCurrencySymbol()})`;

      // Mettre à jour les données avec la nouvelle devise
      const monthlyData = Array(12).fill(0);
      (this.dashboardData.paymentStats?.monthlyPayments || []).forEach(item => {
        monthlyData[item.month - 1] = item.amount;
      });

      this.paymentChart.data.datasets[0].data = monthlyData.map(amount =>
        this.convertCurrency(amount)
      );
      this.paymentChart.update();
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR');
    } catch {
      return '';
    }
  }

  getTotalCredits(): number {
    const stats = this.dashboardData.creditStats;
    if (!stats) return 0;
    return (
      (stats.credits_actifs || 0) +
      (stats.credits_expires || 0) +
      (stats.credits_annules || 0) +
      (stats.credits_rembourses || 0)
    );
  }
}
