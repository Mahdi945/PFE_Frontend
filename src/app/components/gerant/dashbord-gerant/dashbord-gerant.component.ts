import { Component, OnInit, AfterViewInit } from '@angular/core';
import { GestionCreditsService } from '../../../services/gestion-credits.service';
import { Chart, registerables } from 'chart.js';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);
interface UserChartFilter {
  type: string;
  month?: number;
  year?: number;
  startDate?: string;  // Ajouté
  endDate?: string;    // Ajouté
  timeZone?: string;   // Optionnel - seulement si vous utilisez la gestion des timezones
}
interface PaymentStats {
  total_payments: number;
  total_amount: number;
  payments_by_type: any[];
  recent_payments: any[];
  payments_by_date: any[];
}

@Component({
  selector: 'app-dashbord-gerant',
  standalone: true,
  imports: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    CommonModule,
    FormsModule
  ],
  templateUrl: './dashbord-gerant.component.html',
  styleUrls: ['./dashbord-gerant.component.css'],
  providers: [CurrencyPipe, DatePipe]
})
export class DashbordGerantComponent implements OnInit, AfterViewInit {
  public dashboardData: any = {};
  public filteredData: any = {};
  public isLoading: boolean = true;
  public charts: any = {};
  public activeSection: string = 'users';
  public selectedCurrency: string = 'TND';
  
  // Filtres
  public userChartFilter: UserChartFilter = { 
    type: 'month', 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  };
  public transactionChartFilter = { type: 'month', month: new Date().getMonth() + 1, year: new Date().getFullYear() };
  public revenueChartFilter = { type: 'month', month: new Date().getMonth() + 1, year: new Date().getFullYear() };
  public paymentChartFilter = { type: 'month', month: new Date().getMonth() + 1, year: new Date().getFullYear() };
  
  public paymentStats: PaymentStats = {
    total_payments: 0,
    total_amount: 0,
    payments_by_type: [],
    recent_payments: [],
    payments_by_date: []
  };
  

  public years: number[] = [];
  public months = [
    { value: 1, name: 'Janvier' },
    { value: 2, name: 'Février' },
    { value: 3, name: 'Mars' },
    { value: 4, name: 'Avril' },
    { value: 5, name: 'Mai' },
    { value: 6, name: 'Juin' },
    { value: 7, name: 'Juillet' },
    { value: 8, name: 'Août' },
    { value: 9, name: 'Septembre' },
    { value: 10, name: 'Octobre' },
    { value: 11, name: 'Novembre' },
    { value: 12, name: 'Décembre' }
  ];
  

  constructor(
    private creditService: GestionCreditsService,
    private currencyPipe: CurrencyPipe,
    private datePipe: DatePipe
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }
 
  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.isLoading) {
        this.initCharts();
      }
    }, 500);
  }

  loadDashboardData(): void {
    this.isLoading = true;
    const filter = { type: 'month' };
    
    this.creditService.getGerantDashboard(filter).subscribe({
      next: (response) => {
        this.dashboardData = response.data;
        this.prepareDailyRevenuesData();
        this.preparePaymentData();
        this.prepareUserStatsData(); // Ajoutez cette ligne
        this.applyFilters();
        this.isLoading = false;
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.isLoading = false;
      }
    });
  }

  prepareDailyRevenuesData(): void {
    if (!this.dashboardData.dailyRevenues) return;
    
    if (!Array.isArray(this.dashboardData.dailyRevenues)) {
      this.dashboardData.dailyRevenues = [];
    }
    
    this.dashboardData.dailyRevenues = this.dashboardData.dailyRevenues.map((item: any) => ({
      date: item.date || new Date().toISOString().split('T')[0],
      montant: Number(item.montant) || 0,
      nom_produit: item.nom_produit || 'Autre',
      quantite: Number(item.quantite) || 0,
      prix_unitaire: Number(item.prix_unitaire) || 0,
      pistolet_id: item.pistolet_id || 0
    }));
  
    this.dashboardData.dailyRevenues.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  preparePaymentData(): void {
    if (this.dashboardData.paymentStats) {
      this.paymentStats = {
        total_payments: this.dashboardData.paymentStats.total_payments || 0,
        total_amount: this.dashboardData.paymentStats.total_amount || 0,
        payments_by_type: this.dashboardData.paymentStats.payments_by_type || [],
        recent_payments: this.dashboardData.paymentStats.recent_payments || [],
        payments_by_date: this.dashboardData.paymentStats.payments_by_date || []
      };
    }
  }
  prepareUserStatsData(): void {
    if (!this.dashboardData.userStats) {
      // Valeurs par défaut si userStats est vide
      this.dashboardData.userStats = {
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        clients: 0,
        pompistes: 0,
        gerants: 0,
        cogerants: 0
      };
      return;
    }
  
    // Si les données sont dans un tableau (format [0][0])
    if (Array.isArray(this.dashboardData.userStats)) {
      this.dashboardData.userStats = this.dashboardData.userStats[0]?.[0] || {};
    }
  
    // S'assurer que toutes les propriétés existent
    const stats = this.dashboardData.userStats;
    this.dashboardData.userStats = {
      total_users: stats.total_users || 0,
      active_users: stats.active_users || 0,
      inactive_users: stats.inactive_users || 0,
      clients: stats.clients || 0,
      pompistes: stats.pompistes || 0,
      gerants: stats.gerants || 0,
      cogerants: stats.cogerants || 0
    };
  }

  applyFilters(): void {
    this.filteredData = {...this.dashboardData};
    
    // Filtrer les transactions
    if (this.dashboardData.allTransactions && Array.isArray(this.dashboardData.allTransactions)) {
      this.filteredData.filteredTransactions = this.filterData(
        this.dashboardData.allTransactions, 
        'date_transaction', 
        this.transactionChartFilter
      ).slice(0, 10);
    }
    
    // Filtrer les revenus journaliers
    if (this.dashboardData.dailyRevenues && Array.isArray(this.dashboardData.dailyRevenues)) {
      this.filteredData.filteredDailyRevenues = this.filterData(
        this.dashboardData.dailyRevenues,
        'date',
        this.revenueChartFilter
      );
    }
  
    // Filtrer les paiements
    if (this.paymentStats.recent_payments && Array.isArray(this.paymentStats.recent_payments)) {
      this.filteredData.filteredPayments = this.filterData(
        this.paymentStats.recent_payments,
        'date_paiement',
        this.paymentChartFilter
      );
    }
  
    // Filtrer les paiements par date
    if (this.paymentStats.payments_by_date && Array.isArray(this.paymentStats.payments_by_date)) {
      this.filteredData.filteredPaymentsByDate = this.filterData(
        this.paymentStats.payments_by_date,
        'date',
        this.paymentChartFilter
      );
    }
  
    // Filtrer les utilisateurs
    if (this.dashboardData.userStats && Array.isArray(this.dashboardData.userStats)) {
      this.filteredData.filteredUserStats = this.filterData(
        this.dashboardData.userStats,
        'temps_de_creation',
        this.userChartFilter // Assurez-vous d'avoir un filtre pour les utilisateurs
      );
    }
  }

  filterData(data: any[], dateField: string, filter: any): any[] {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => {
      if (!item[dateField]) return false;
      
      const itemDate = new Date(item[dateField]);
      if (isNaN(itemDate.getTime())) return false;
      
      const currentDate = new Date();
      
      switch(filter.type) {
        case 'day':
          return itemDate.getDate() === currentDate.getDate() && 
                 itemDate.getMonth() === currentDate.getMonth() && 
                 itemDate.getFullYear() === currentDate.getFullYear();
        case 'month':
          return itemDate.getMonth() + 1 === filter.month && 
                 itemDate.getFullYear() === filter.year;
        case 'year':
          return itemDate.getFullYear() === filter.year;
        default:
          return true;
      }
    }).sort((a, b) => {
      const dateA = new Date(a[dateField]).getTime();
      const dateB = new Date(b[dateField]).getTime();
      return dateB - dateA;
    });
  }

  getTotalRevenue(): number {
    if (!this.filteredData.filteredDailyRevenues || !Array.isArray(this.filteredData.filteredDailyRevenues)) return 0;
    
    return this.filteredData.filteredDailyRevenues.reduce((sum: number, revenue: any) => {
      return sum + (revenue.montant || 0);
    }, 0);
  }

  getTotalPayments(): number {
    if (!this.filteredData.filteredPaymentsByDate || !Array.isArray(this.filteredData.filteredPaymentsByDate)) return 0;
    
    return this.filteredData.filteredPaymentsByDate.reduce((sum: number, payment: any) => {
      return sum + (payment.total_paye || 0);
    }, 0);
  }

  updateUserChartFilter(type: string): void {
    // Création du nouveau filtre avec conversion des dates si nécessaire
    const newFilter: UserChartFilter = { 
      type: type,
      month: type === 'month' ? new Date().getMonth() + 1 : undefined,
      year: type !== 'day' ? new Date().getFullYear() : undefined,
      // Conversion des dates au format backend si elles existent
      startDate: this.userChartFilter.startDate 
                ? this.formatDateForBackend(this.userChartFilter.startDate)
                : undefined,
      endDate: this.userChartFilter.endDate 
              ? this.formatDateForBackend(this.userChartFilter.endDate)
              : undefined
    };
  
    // Mise à jour du filtre et déclenchement de la requête
    this.userChartFilter = newFilter;
    this.onUserFilterChange();
  }
  
  private formatDateForBackend(dateString: string): string {
    if (!dateString) return '';
    
    // Si la date est déjà au format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    
    // Conversion depuis DD/MM/YYYY
    const [day, month, year] = dateString.split('/');
    if (day && month && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateString; // Retour original si format non reconnu
  }

  updateTransactionChartFilter(type: string): void {
    this.transactionChartFilter.type = type;
    this.onTransactionFilterChange();
  }

  updateRevenueChartFilter(type: string): void {
    this.revenueChartFilter.type = type;
    this.onRevenueFilterChange();
  }

  updatePaymentChartFilter(type: string): void {
    this.paymentChartFilter.type = type;
    this.onPaymentFilterChange();
  }
  onUserFilterChange(): void {
    this.isLoading = true;
    
    // Créer un nouveau filtre au lieu de modifier l'existant
    const filter: UserChartFilter = { type: this.userChartFilter.type };
    
    // Ajouter mois/année seulement si nécessaire
    if (filter.type === 'month') {
      filter.month = this.userChartFilter.month;
      filter.year = this.userChartFilter.year;
    } else if (filter.type === 'year') {
      filter.year = this.userChartFilter.year;
    }
  
    this.creditService.getGerantDashboard(filter).subscribe({
      next: (response) => {
        this.dashboardData = response.data;
        this.prepareUserStatsData();
        this.applyFilters();
        this.isLoading = false;
        setTimeout(() => this.updateCharts(), 100);
      },
      error: (err) => {
        console.error('Error filtering user stats:', err);
        this.isLoading = false;
      }
    });
  }

  onTransactionFilterChange(): void {
    this.applyFilters();
    this.updateCharts();
  }

  onRevenueFilterChange(): void {
    this.applyFilters();
    this.updateCharts();
  }

  onPaymentFilterChange(): void {
    this.applyFilters();
    this.updateCharts();
  }

  initCharts(): void {
    this.createAccountStatusChart();
    this.createUserRolesChart();
    this.createCreditStatusChart();
    this.createTransactionsChart();
    this.createPompeStatsChart();
    this.createDailyRevenuesChart();
    this.createPaymentsChart();
    this.createPaymentsTrendChart();
  }

  updateCharts(): void {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
      }
    });
    this.initCharts();
  }

  createAccountStatusChart(): void {
    const ctx = document.getElementById('accountStatusChart') as HTMLCanvasElement;
    if (!ctx || !this.dashboardData.userStats) return;

    const active = this.dashboardData.userStats.active_users || 0;
    const inactive = this.dashboardData.userStats.inactive_users || 0;
    const total = active + inactive;
    const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;
    const inactivePercent = total > 0 ? Math.round((inactive / total) * 100) : 0;

    this.charts.accountStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [`Activés (${activePercent}%)`, `Désactivés (${inactivePercent}%)`],
        datasets: [{
          data: [active, inactive],
          backgroundColor: ['#4BC0C0', '#FF6384'],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Statut des Comptes Utilisateurs', 
            font: { size: 16 },
            padding: { top: 20, bottom: 10 }
          },
          legend: { position: 'bottom' }
        }
      }
    });
  }

  createUserRolesChart(): void {
    const ctx = document.getElementById('userRolesChart') as HTMLCanvasElement;
    if (!ctx || !this.dashboardData.userStats) return;

    const roles = ['Clients', 'Pompistes', 'Gérants', 'Co-gérants'];
    const counts = [
      this.dashboardData.userStats.clients || 0,
      this.dashboardData.userStats.pompistes || 0,
      this.dashboardData.userStats.gerants || 0,
      this.dashboardData.userStats.cogerants || 0
    ];

    this.charts.userRoles = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: roles,
        datasets: [{
          data: counts,
          backgroundColor: ['#36A2EB', '#FFCE56', '#FF9F40', '#9966FF'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Répartition des Rôles', 
            font: { size: 16 },
            padding: { top: 20, bottom: 10 }
          },
          legend: { position: 'bottom' }
        }
      }
    });
  }

  createCreditStatusChart(): void {
    const ctx = document.getElementById('creditStatusChart') as HTMLCanvasElement;
    if (!ctx || !this.dashboardData.creditStats) return;

    const statusData = {
      labels: ['Actifs', 'Expirés', 'Remboursés'],
      datasets: [{
        data: [
          this.dashboardData.creditStats.credits_actifs || 0,
          this.dashboardData.creditStats.credits_expires || 0,
          this.dashboardData.creditStats.credits_rembourses || 0
        ],
        backgroundColor: ['#36A2EB', '#FF6384', '#4BC0C0'],
        borderWidth: 1
      }]
    };

    this.charts.creditStatus = new Chart(ctx, {
      type: 'pie',
      data: statusData,
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Statut des Crédits', 
            font: { size: 16 },
            padding: { top: 20, bottom: 10 }
          },
          legend: { position: 'bottom' }
        }
      }
    });
  }

  createTransactionsChart(): void {
    const ctx = document.getElementById('transactionsChart') as HTMLCanvasElement;
    if (!ctx || !this.filteredData.filteredTransactions || !Array.isArray(this.filteredData.filteredTransactions)) return;

    const sortedTransactions = [...this.filteredData.filteredTransactions].sort((a, b) => 
      new Date(a.date_transaction).getTime() - new Date(b.date_transaction).getTime()
    );

    const labels = sortedTransactions.map((t: any) => 
      this.datePipe.transform(t.date_transaction, 'shortDate'));
    const data = sortedTransactions.map((t: any) => t.montant);

    this.charts.transactions = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Montant des transactions',
          data: data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          pointBackgroundColor: 'rgb(75, 192, 192)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Transactions Récentes', 
            font: { size: 16 },
            padding: { top: 20, bottom: 10 }
          }
        },
        scales: { 
          y: { 
            beginAtZero: false,
            ticks: {
              callback: (value: any) => this.formatCurrency(value)
            }
          }
        }
      }
    });
  }

  createPompeStatsChart(): void {
    const ctx = document.getElementById('pompeStatsChart') as HTMLCanvasElement;
    if (!ctx || !this.dashboardData.pompeStats || !Array.isArray(this.dashboardData.pompeStats)) return;

    const labels = this.dashboardData.pompeStats.map((p: any) => p.numero_pompe);
    const activePistolets = this.dashboardData.pompeStats.map((p: any) => p.pistolets_actifs || 0);
    const totalPistolets = this.dashboardData.pompeStats.map((p: any) => p.nombre_pistolets || 0);

    this.charts.pompeStats = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Pistolets Actifs',
            data: activePistolets,
            backgroundColor: 'rgba(75, 192, 192, 0.7)'
          },
          {
            label: 'Total Pistolets',
            data: totalPistolets,
            backgroundColor: 'rgba(54, 162, 235, 0.7)'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Statistiques des Pompes', 
            font: { size: 16 },
            padding: { top: 20, bottom: 10 }
          },
          legend: { position: 'bottom' }
        },
        scales: { 
          y: { beginAtZero: true },
          x: { grid: { display: false } }
        }
      }
    });
  }

  createDailyRevenuesChart(): void {
    const ctx = document.getElementById('dailyRevenuesChart') as HTMLCanvasElement;
    if (!ctx || !this.filteredData.filteredDailyRevenues || !Array.isArray(this.filteredData.filteredDailyRevenues)) {
      console.warn('Cannot create chart - missing required data');
      return;
    }
  
    const revenueData: {[key: string]: {[key: string]: number}} = {};
    const dates = new Set<string>();
  
    this.filteredData.filteredDailyRevenues.forEach((item: any) => {
      const date = item.date;
      const product = item.nom_produit;
      const amount = Number(item.montant) || 0;
      
      dates.add(date);
      
      if (!revenueData[date]) {
        revenueData[date] = {};
      }
      
      revenueData[date][product] = (revenueData[date][product] || 0) + amount;
    });
  
    const sortedDates = Array.from(dates).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  
    const products = new Set<string>();
    this.filteredData.filteredDailyRevenues.forEach((item: any) => {
      products.add(item.nom_produit);
    });
  
    const productDatasets = Array.from(products).map(product => {
      return {
        label: product,
        data: sortedDates.map(date => revenueData[date][product] || 0),
        backgroundColor: this.getRandomColor(),
        borderColor: this.getRandomColor(),
        tension: 0.1
      };
    });
  
    const totals = sortedDates.map(date => 
      Object.values(revenueData[date]).reduce((sum, val) => sum + val, 0)
    );
  
    this.charts.dailyRevenues = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedDates.map(date => this.datePipe.transform(date, 'shortDate')),
        datasets: [
          {
            label: 'Total',
            data: totals,
            type: 'line',
            borderColor: '#FF6384',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointBackgroundColor: '#FF6384'
          },
          ...productDatasets
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Revenus Journaliers', 
            font: { size: 16 },
            padding: { top: 20, bottom: 10 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.raw || 0;
                return `${label}: ${this.formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: false,
            ticks: {
              callback: (value) => this.formatCurrency(value)
            }
          },
          x: { 
            grid: { display: false },
            ticks: {
              autoSkip: true,
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  }

  createPaymentsChart(): void {
    const ctx = document.getElementById('paymentsChart') as HTMLCanvasElement;
    if (!ctx || !this.paymentStats.payments_by_type || !Array.isArray(this.paymentStats.payments_by_type)) return;

    const labels = this.paymentStats.payments_by_type.map(p => p.type_paiement);
    const data = this.paymentStats.payments_by_type.map(p => p.total);

    this.charts.payments = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Montant par type de paiement',
          data: data,
          backgroundColor: labels.map(() => this.getRandomColor()),
          borderColor: labels.map(() => this.getRandomColor()),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Répartition des Paiements', 
            font: { size: 16 },
            padding: { top: 20, bottom: 10 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.raw || 0;
                return `${label}: ${this.formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value)
            }
          }
        }
      }
    });
  }

  createPaymentsTrendChart(): void {
    const ctx = document.getElementById('paymentsTrendChart') as HTMLCanvasElement;
    if (!ctx || !this.filteredData.filteredPaymentsByDate || !Array.isArray(this.filteredData.filteredPaymentsByDate)) {
      console.warn('Cannot create payments trend chart - missing data');
      return;
    }

    const sortedPayments = [...this.filteredData.filteredPaymentsByDate].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedPayments.map(p => this.datePipe.transform(p.date, 'shortDate'));
    const amounts = sortedPayments.map(p => p.total_paye);
    const counts = sortedPayments.map(p => p.nombre_paiements);

    this.charts.paymentsTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Montant total',
            data: amounts,
            yAxisID: 'y',
            borderColor: '#4BC0C0',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Nombre de paiements',
            data: counts,
            yAxisID: 'y1',
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Évolution des Paiements', 
            font: { size: 16 },
            padding: { top: 20, bottom: 10 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                let value = context.raw || 0;
                if (context.datasetIndex === 0) {
                  return `${label}: ${this.formatCurrency(value)}`;
                } else {
                  return `${label}: ${value}`;
                }
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Montant (TND)'
            },
            ticks: {
              callback: (value) => this.formatCurrency(value)
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Nombre'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  formatCurrency(value: number | string | any): string {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numericValue)) return 'N/A';
  
    return this.currencyPipe.transform(
      numericValue, 
      this.selectedCurrency, 
      'symbol', 
      '1.2-2'
    ) || '';
  }

  formatDate(value: string): string {
    return this.datePipe.transform(value, 'medium') || '';
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    setTimeout(() => this.updateCharts(), 50);
  }

  getRandomColor(): string {
    return `#${Math.floor(Math.random()*16777215).toString(16)}`;
  }
  
}