import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { GestionCreditsService } from '../../../services/gestion-credits.service';
import { GestionStockService } from '../../../services/gestion-stock.service';
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
  startDate?: string;
  endDate?: string;
}

interface PaymentStats {
  total_payments: number;
  total_amount: number;
  payments_by_type: any[];
  recent_payments: any[];
  payments_by_date: any[];
}

interface StockMovement {
  id: number;
  produit_id: number;
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
  quantite: number;
  date_mouvement: string;
  agent_id?: number;
  raison?: string;
  produit_nom: string;
  agent_nom?: string;
}

interface StockStats {
  todaySalesCount: number;
  todaySalesAmount: number;
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  stockValue: number;
  last7DaysLabels: string[];
  last7DaysData: number[];
  topProductsLabels: string[];
  topProductsData: number[];
  lowStockProductsList: any[];
  todayMovements: StockMovement[];
}

@Component({
  selector: 'app-dashbord-gerant',
  standalone: true,
  imports: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './dashbord-gerant.component.html',
  styleUrls: ['./dashbord-gerant.component.css'],
  providers: [CurrencyPipe, DatePipe],
})
export class DashbordGerantComponent implements OnInit, AfterViewInit {
  public dashboardData: any = {};
  public filteredData: any = {};
  public isLoading: boolean = true;
  public charts: any = {};

  public activeSection: string = 'users';
  public selectedCurrency: string = 'TND';
  private exchangeRates: any = {
    TND: 1,
    EUR: 0.31, // 1 TND = 0.31 EUR
    USD: 0.34, // 1 TND = 0.34 USD
  };

  // Filtres
  public userChartFilter: UserChartFilter = {
    type: 'month',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };
  public transactionChartFilter = {
    type: 'month',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };
  public revenueChartFilter = {
    type: 'month',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };
  public paymentChartFilter = {
    type: 'month',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };

  // Données Stock
  public stockStats: StockStats = {
    todaySalesCount: 0,
    todaySalesAmount: 0,
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
    stockValue: 0,
    last7DaysLabels: [],
    last7DaysData: [],
    topProductsLabels: [],
    topProductsData: [],
    lowStockProductsList: [],
    todayMovements: [],
  };

  public lowStockProducts: any[] = []; // Initialisez avec un tableau vide
  public paymentStats: PaymentStats = {
    total_payments: 0,
    total_amount: 0,
    payments_by_type: [],
    recent_payments: [],
    payments_by_date: [],
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
    { value: 12, name: 'Décembre' },
  ];
  @ViewChild('weeklySalesChart', { static: false })
  weeklySalesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topProductsChart', { static: false })
  topProductsChartRef!: ElementRef<HTMLCanvasElement>;
  constructor(
    private creditService: GestionCreditsService,
    private gestionStockService: GestionStockService,
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
    this.loadStockStats();
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
      next: response => {
        this.dashboardData = response.data;
        this.prepareDailyRevenuesData();
        this.preparePaymentData();
        this.prepareUserStatsData();
        this.prepareTransactionTrendsData();
        this.prepareCreditsWithVehiculesData();
        this.applyFilters();
        this.isLoading = false;
        setTimeout(() => this.initCharts(), 100);
      },
      error: err => {
        console.error('Error loading dashboard data:', err);
        this.isLoading = false;
      },
    });
  }
  loadStockStats(): void {
    console.log('Loading stock stats...');
    this.isLoading = true;
    this.gestionStockService.getStockStats().subscribe({
      next: (stats: any) => {
        console.log('Stock stats received:', stats);

        // Conversion des données
        const processedStats: StockStats = {
          todaySalesCount: stats.todaySalesCount
            ? parseInt(stats.todaySalesCount)
            : 0,
          todaySalesAmount: stats.todaySalesAmount
            ? parseFloat(stats.todaySalesAmount.toString().replace(',', '.'))
            : 0,
          totalProducts: stats.total_produits ? parseInt(stats.total_produits) : 0,
          totalStock: stats.total_stock ? parseInt(stats.total_stock) : 0,
          lowStockProducts: stats.produits_alerte
            ? parseInt(stats.produits_alerte)
            : 0,
          stockValue: stats.valeur_stock
            ? parseFloat(stats.valeur_stock.toString().replace(',', '.'))
            : 0,
          last7DaysLabels:
            stats.last7DaysLabels?.map((label: string) => label.substring(0, 3)) ||
            [],
          last7DaysData:
            stats.last7DaysData?.map((val: any) =>
              parseFloat(typeof val === 'string' ? val.replace(',', '.') : val)
            ) || [],
          topProductsLabels: stats.topProductsLabels || [],
          topProductsData:
            stats.topProductsData?.map((val: any) =>
              parseInt(typeof val === 'string' ? val : val.toString())
            ) || [],
          lowStockProductsList: stats.lowStockProductsList || [],
          todayMovements:
            stats.todayMovements?.map((mov: any) => ({
              ...mov,
              type: mov.type.toUpperCase(), // Normalisation du type en majuscules
            })) || [],
        };

        this.stockStats = processedStats;
        console.log('Processed stock stats:', this.stockStats);

        // Destruction des anciens graphiques
        if (this.charts.weeklySales) {
          this.charts.weeklySales.destroy();
        }
        if (this.charts.topProducts) {
          this.charts.topProducts.destroy();
        }

        // Création des nouveaux graphiques
        setTimeout(() => {
          this.initStockCharts();
          this.isLoading = false;
        }, 0);
      },
      error: err => {
        console.error('Erreur chargement stats stock', err);
        this.initStockChartsWithDefaultData();
        this.isLoading = false;
      },
    });
  }

  initStockChartsWithDefaultData(): void {
    this.stockStats = {
      todaySalesCount: 0,
      todaySalesAmount: 0,
      totalProducts: 0,
      totalStock: 0,
      lowStockProducts: 0,
      stockValue: 0,
      last7DaysLabels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      last7DaysData: [0, 0, 0, 0, 0, 0, 0],
      topProductsLabels: [
        'Produit 1',
        'Produit 2',
        'Produit 3',
        'Produit 4',
        'Produit 5',
      ],
      topProductsData: [0, 0, 0, 0, 0],
      lowStockProductsList: [],
      todayMovements: [],
    };

    setTimeout(() => {
      this.initStockCharts();
    }, 0);
  }

  initStockCharts(): void {
    // Vérification que les éléments canvas existent
    const weeklySalesCanvas = document.getElementById(
      'weeklySalesChart'
    ) as HTMLCanvasElement;
    const topProductsCanvas = document.getElementById(
      'topProductsChart'
    ) as HTMLCanvasElement;

    if (!weeklySalesCanvas || !topProductsCanvas) {
      console.error('Canvas elements not found');
      return;
    }

    // Graphique des ventes hebdomadaires
    if (
      this.stockStats.last7DaysLabels.length > 0 &&
      this.stockStats.last7DaysData.length > 0
    ) {
      this.charts.weeklySales = new Chart(weeklySalesCanvas, {
        type: 'line',
        data: {
          labels: this.stockStats.last7DaysLabels,
          datasets: [
            {
              label: 'Montant des ventes (TND)',
              data: this.stockStats.last7DaysData,
              borderColor: '#4e73df',
              backgroundColor: 'rgba(78, 115, 223, 0.05)',
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: context => {
                  return `${context.dataset.label}: ${this.formatCurrency(Number(context.raw))}`;
                },
              },
            },
            legend: {
              display: true,
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => this.formatCurrency(Number(value)),
              },
            },
          },
        },
      });
    }

    // Graphique des top produits
    if (
      this.stockStats.topProductsLabels.length > 0 &&
      this.stockStats.topProductsData.length > 0
    ) {
      this.charts.topProducts = new Chart(topProductsCanvas, {
        type: 'bar',
        data: {
          labels: this.stockStats.topProductsLabels,
          datasets: [
            {
              label: 'Quantité vendue',
              data: this.stockStats.topProductsData,
              backgroundColor: '#1cc88a',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            tooltip: {
              callbacks: {
                label: context => {
                  return `${context.dataset.label}: ${context.raw} unités`;
                },
              },
            },
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                stepSize: 1,
              },
            },
          },
        },
      });
    }
  }

  prepareCreditsWithVehiculesData(): void {
    if (!this.dashboardData.creditsWithVehicules) {
      this.dashboardData.creditsWithVehicules = [];
      return;
    }

    // Formater les données des véhicules pour chaque crédit
    this.dashboardData.creditsWithVehicules =
      this.dashboardData.creditsWithVehicules.map((credit: any) => {
        if (credit.vehicules && typeof credit.vehicules === 'string') {
          try {
            credit.vehicules = JSON.parse(credit.vehicules);
          } catch (e) {
            credit.vehicules = credit.vehicules
              .split(',')
              .map((v: string) => v.trim());
          }
        }
        return credit;
      });
  }

  prepareDailyRevenuesData(): void {
    if (!this.dashboardData.dailyRevenues) return;

    if (!Array.isArray(this.dashboardData.dailyRevenues)) {
      this.dashboardData.dailyRevenues = [];
    }

    this.dashboardData.dailyRevenues = this.dashboardData.dailyRevenues.map(
      (item: any) => ({
        date: item.date || new Date().toISOString().split('T')[0],
        montant: Number(item.montant) || 0,
        nom_produit: item.nom_produit || 'Autre',
        quantite: Number(item.quantite) || 0,
        prix_unitaire: Number(item.prix_unitaire) || 0,
        pistolet_id: item.pistolet_id || 0,
      })
    );

    this.dashboardData.dailyRevenues.sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  prepareTransactionTrendsData(): void {
    if (!this.dashboardData.transactionTrends) {
      this.dashboardData.transactionTrends = [];
      return;
    }

    this.dashboardData.transactionTrends = this.dashboardData.transactionTrends.map(
      (item: any) => ({
        ...item,
        monthName: this.months[item.month - 1]?.name || 'Mois inconnu',
      })
    );
  }
  preparePaymentData(): void {
    if (this.dashboardData.paymentStats) {
      // Calculer les totaux à partir de payments_by_date si disponibles
      if (this.dashboardData.paymentStats.payments_by_date) {
        const total_payments =
          this.dashboardData.paymentStats.payments_by_date.reduce(
            (sum: number, item: any) => sum + (item.nombre_paiements || 0),
            0
          );

        const total_amount = this.dashboardData.paymentStats.payments_by_date.reduce(
          (sum: number, item: any) => sum + parseFloat(item.total_paye || 0),
          0
        );

        this.paymentStats = {
          total_payments,
          total_amount,
          payments_by_type: this.dashboardData.paymentStats.payments_by_type || [],
          recent_payments: this.dashboardData.recentPayments || [],
          payments_by_date: this.dashboardData.paymentStats.payments_by_date || [],
        };
      } else {
        this.paymentStats = {
          total_payments: this.dashboardData.paymentStats.total_payments || 0,
          total_amount: this.dashboardData.paymentStats.total_amount || 0,
          payments_by_type: this.dashboardData.paymentStats.payments_by_type || [],
          recent_payments: this.dashboardData.recentPayments || [],
          payments_by_date: [],
        };
      }

      console.log('Payment stats prepared:', this.paymentStats);
    }
  }
  prepareUserStatsData(): void {
    if (!this.dashboardData.userStats) {
      this.dashboardData.userStats = {
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        clients: 0,
        pompistes: 0,
        gerants: 0,
        cogerants: 0,
        caissiers: 0,
      };
      return;
    }

    if (Array.isArray(this.dashboardData.userStats)) {
      this.dashboardData.userStats = this.dashboardData.userStats[0]?.[0] || {};
    }

    const stats = this.dashboardData.userStats;
    this.dashboardData.userStats = {
      total_users: stats.total_users || 0,
      active_users: stats.active_users || 0,
      inactive_users: stats.inactive_users || 0,
      clients: stats.clients || 0,
      pompistes: stats.pompistes || 0,
      gerants: stats.gerants || 0,
      cogerants: stats.cogerants || 0,
      caissiers: stats.caissiers || 0,
    };
  }
  applyFilters(): void {
    this.filteredData = { ...this.dashboardData };

    // Dans applyFilters()
    if (this.dashboardData.allTransactions) {
      this.filteredData.filteredTransactions = this.filterData(
        this.dashboardData.allTransactions,
        'date_transaction',
        this.transactionChartFilter
      );

      // Pour le graphique mensuel, préparer les données quotidiennes
      if (this.transactionChartFilter.type === 'month') {
        const dailyTransactions: { [key: string]: any } = {};

        this.filteredData.filteredTransactions.forEach((transaction: any) => {
          const date = transaction.date_transaction.split('T')[0];
          if (!dailyTransactions[date]) {
            dailyTransactions[date] = {
              date_transaction: date,
              montant: 0,
              count: 0,
            };
          }
          dailyTransactions[date].montant += transaction.montant;
          dailyTransactions[date].count++;
        });

        this.filteredData.filteredDailyTransactions = Object.values(
          dailyTransactions
        ).sort(
          (a: any, b: any) =>
            new Date(a.date_transaction).getTime() -
            new Date(b.date_transaction).getTime()
        );
      }
    }

    // Filtrer les revenus journaliers
    if (this.dashboardData.dailyRevenues) {
      this.filteredData.filteredDailyRevenues = this.filterData(
        this.dashboardData.dailyRevenues,
        'date',
        this.revenueChartFilter
      );
    }

    // Filtrer les paiements
    if (this.paymentStats.recent_payments) {
      this.filteredData.filteredPayments = this.filterData(
        this.paymentStats.recent_payments,
        'date_paiement',
        this.paymentChartFilter
      );
    }

    // Filtrer les paiements par date
    if (this.paymentStats.payments_by_date) {
      this.filteredData.filteredPaymentsByDate = this.filterData(
        this.paymentStats.payments_by_date,
        'date',
        this.paymentChartFilter
      );
    }

    // Filtrer les tendances des transactions
    if (this.dashboardData.transactionTrends) {
      this.filteredData.filteredTransactionTrends =
        this.dashboardData.transactionTrends
          .filter((item: any) => item.year == this.transactionChartFilter.year)
          .sort((a: any, b: any) => a.month - b.month);
    }
  }

  filterData(data: any[], dateField: string, filter: any): any[] {
    if (!Array.isArray(data)) return [];

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();

    return data
      .filter(item => {
        if (!item[dateField]) return false;

        const itemDate = new Date(item[dateField]);
        if (isNaN(itemDate.getTime())) return false;

        const itemDay = itemDate.getDate();
        const itemMonth = itemDate.getMonth() + 1;
        const itemYear = itemDate.getFullYear();

        switch (filter.type) {
          case 'day':
            return (
              itemDay === currentDay &&
              itemMonth === currentMonth &&
              itemYear === currentYear
            );
          case 'month':
            return (
              itemMonth === (filter.month || currentMonth) &&
              itemYear === (filter.year || currentYear)
            );
          case 'year':
            return itemYear === (filter.year || currentYear);
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a[dateField]).getTime();
        const dateB = new Date(b[dateField]).getTime();
        return dateA - dateB;
      });
  }

  getTotalRevenue(): number {
    if (!this.filteredData.filteredDailyRevenues) return 0;

    return this.filteredData.filteredDailyRevenues.reduce(
      (sum: number, revenue: any) => {
        return sum + (revenue.montant || 0);
      },
      0
    );
  }

  getTotalPayments(): number {
    if (!this.filteredData.filteredPaymentsByDate) return 0;

    return this.filteredData.filteredPaymentsByDate.reduce(
      (sum: number, payment: any) => {
        return sum + (payment.total_paye || 0);
      },
      0
    );
  }

  updateUserChartFilter(type: string): void {
    this.userChartFilter.type = type;
    this.onUserFilterChange();
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
    const filter: any = { type: this.userChartFilter.type };

    if (filter.type === 'month') {
      filter.month = this.userChartFilter.month;
      filter.year = this.userChartFilter.year;
    } else if (filter.type === 'year') {
      filter.year = this.userChartFilter.year;
    }

    this.creditService.getGerantDashboard(filter).subscribe({
      next: response => {
        this.dashboardData.userStats = response.data.userStats;
        this.prepareUserStatsData();
        this.applyFilters();
        this.isLoading = false;
        setTimeout(() => this.updateCharts(), 100);
      },
      error: err => {
        console.error('Error filtering user stats:', err);
        this.isLoading = false;
      },
    });
  }

  // Mettre à jour onTransactionFilterChange
  onTransactionFilterChange(): void {
    this.applyFilters();
    this.createTransactionStatsChart(); // Utiliser la nouvelle méthode
  }

  onRevenueFilterChange(): void {
    this.applyFilters();
    this.ccreateDailyRevenuesChart();
  }

  onPaymentFilterChange(): void {
    this.applyFilters();
    this.createPaymentsTrendChart();
  }

  initCharts(): void {
    this.createAccountStatusChart();
    this.createUserRolesChart();
    this.createCreditStatusChart();
    this.createTransactionStatsChart();
    this.createPompeStatsChart();
    this.ccreateDailyRevenuesChart();
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
        datasets: [
          {
            data: [active, inactive],
            backgroundColor: ['#4BC0C0', '#FF6384'],
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Statut des Comptes Utilisateurs',
            font: { size: 16 },
            padding: { top: 20, bottom: 10 },
          },
          legend: { position: 'bottom' },
        },
      },
    });
  }

  createUserRolesChart(): void {
    const ctx = document.getElementById('userRolesChart') as HTMLCanvasElement;
    if (!ctx || !this.dashboardData.userStats) return;

    const roles = ['Clients', 'Pompistes', 'Gérants', 'Co-gérants', 'Caissiers'];
    const counts = [
      this.dashboardData.userStats.clients || 0,
      this.dashboardData.userStats.pompistes || 0,
      this.dashboardData.userStats.gerants || 0,
      this.dashboardData.userStats.cogerants || 0,
      this.dashboardData.userStats.caissiers || 0,
    ];

    this.charts.userRoles = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: roles,
        datasets: [
          {
            data: counts,
            backgroundColor: ['#36A2EB', '#FFCE56', '#FF9F40', '#9966FF', '#4BC0C0'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Répartition des Rôles',
            font: { size: 16 },
            padding: { top: 20, bottom: 10 },
          },
          legend: { position: 'bottom' },
        },
      },
    });
  }

  createCreditStatusChart(): void {
    const ctx = document.getElementById('creditStatusChart') as HTMLCanvasElement;
    if (!ctx || !this.dashboardData.creditStats) return;

    const statusData = {
      labels: ['Actifs', 'Expirés', 'Remboursés'],
      datasets: [
        {
          data: [
            this.dashboardData.creditStats.credits_actifs || 0,
            this.dashboardData.creditStats.credits_expires || 0,
            this.dashboardData.creditStats.credits_rembourses || 0,
          ],
          backgroundColor: ['#36A2EB', '#FF6384', '#4BC0C0'],
          borderWidth: 1,
        },
      ],
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
            padding: { top: 20, bottom: 10 },
          },
          legend: { position: 'bottom' },
        },
      },
    });
  }
  createTransactionStatsChart(): void {
    const ctx = document.getElementById(
      'transactionStatsChart'
    ) as HTMLCanvasElement;
    if (!ctx) return;

    // Utiliser payments_by_date comme source principale
    const dataSource = this.paymentStats.payments_by_date;
    if (!dataSource || dataSource.length === 0) {
      console.warn('No transaction data available for chart');
      return;
    }

    // Trier les données par date
    const sortedData = [...dataSource].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Préparer les labels et données
    let labels: string[];
    let data: number[];

    if (this.transactionChartFilter.type === 'year') {
      // Group by month for yearly view
      const monthlyData: { [key: number]: number } = {};

      sortedData.forEach(item => {
        const date = new Date(item.date);
        const month = date.getMonth();
        monthlyData[month] =
          (monthlyData[month] || 0) + parseFloat(item.total_paye || 0);
      });

      labels = this.months.map(m => m.name);
      data = this.months.map((_, index) => monthlyData[index] || 0);
    } else {
      // Daily view
      labels = sortedData.map(item => {
        const date = new Date(item.date);
        return this.transactionChartFilter.type === 'month'
          ? date.getDate().toString()
          : this.datePipe.transform(date, 'shortDate') || '';
      });
      data = sortedData.map(item => parseFloat(item.total_paye || 0));
    }

    // Destroy existing chart if any
    if (this.charts.transactionStats) {
      this.charts.transactionStats.destroy();
    }

    // Create new chart
    this.charts.transactionStats = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Montant des transactions (TND)',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: this.getTransactionStatsTitle(),
            font: { size: 16 },
            padding: { top: 10, bottom: 10 },
          },
          tooltip: {
            callbacks: {
              label: context => {
                return `${context.dataset.label}: ${this.formatCurrency(context.raw)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Montant (TND)',
            },
            ticks: {
              callback: value => this.formatCurrency(value),
            },
          },
          x: {
            title: {
              display: true,
              text: this.transactionChartFilter.type === 'year' ? 'Mois' : 'Jour',
            },
          },
        },
      },
    });
  }
  getTransactionStatsTitle(): string {
    if (this.transactionChartFilter.type === 'month') {
      const monthName = this.months.find(
        m => m.value === this.transactionChartFilter.month
      )?.name;
      return `Transactions - ${monthName} ${this.transactionChartFilter.year}`;
    } else {
      return `Transactions annuelles - ${this.transactionChartFilter.year}`;
    }
  }

  createPompeStatsChart(): void {
    const ctx = document.getElementById('pompeStatsChart') as HTMLCanvasElement;
    if (
      !ctx ||
      !this.dashboardData.pompeStats ||
      !Array.isArray(this.dashboardData.pompeStats)
    )
      return;

    const labels = this.dashboardData.pompeStats.map((p: any) => p.numero_pompe);
    const activePistolets = this.dashboardData.pompeStats.map(
      (p: any) => p.pistolets_actifs || 0
    );
    const totalPistolets = this.dashboardData.pompeStats.map(
      (p: any) => p.nombre_pistolets || 0
    );

    this.charts.pompeStats = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Pistolets Actifs',
            data: activePistolets,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
          },
          {
            label: 'Total Pistolets',
            data: totalPistolets,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Statistiques des Pompes',
            font: { size: 16 },
            padding: { top: 20, bottom: 10 },
          },
          legend: { position: 'bottom' },
        },
        scales: {
          y: { beginAtZero: true },
          x: { grid: { display: false } },
        },
      },
    });
  }

  ccreateDailyRevenuesChart(): void {
    const ctx = document.getElementById('dailyRevenuesChart') as HTMLCanvasElement;
    if (!ctx || !this.filteredData.filteredDailyRevenues) {
      console.warn('Cannot create daily revenues chart - missing data');
      return;
    }

    // Grouper les revenus par date
    const revenueByDate: { [key: string]: number } = {};
    this.filteredData.filteredDailyRevenues.forEach((item: any) => {
      const date = item.date;
      revenueByDate[date] = (revenueByDate[date] || 0) + (item.montant || 0);
    });

    // Trier les dates
    const sortedDates = Object.keys(revenueByDate).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Préparer les labels et données
    let labels: string[];
    const data = sortedDates.map(date => revenueByDate[date]);

    if (this.revenueChartFilter.type === 'month') {
      labels = sortedDates.map(date => {
        const d = new Date(date);
        return d.getDate().toString();
      });
    } else if (this.revenueChartFilter.type === 'year') {
      labels = sortedDates.map(date => {
        const d = new Date(date);
        return this.months[d.getMonth()].name;
      });
    } else {
      labels = sortedDates.map(
        date => this.datePipe.transform(date, 'shortDate') || ''
      );
    }

    // Créer le graphique
    if (this.charts.dailyRevenues) {
      this.charts.dailyRevenues.destroy();
    }

    this.charts.dailyRevenues = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenus Totaux',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: this.getRevenueChartTitle(),
            font: { size: 16 },
            padding: { top: 20, bottom: 10 },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const label = context.dataset.label || '';
                const value = context.raw || 0;
                return `${label}: ${this.formatCurrency(value)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: value => this.formatCurrency(value),
            },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }

  getRevenueChartTitle(): string {
    if (this.revenueChartFilter.type === 'day') {
      return `Revenus du ${this.datePipe.transform(new Date(), 'fullDate')}`;
    } else if (this.revenueChartFilter.type === 'month') {
      const monthName = this.months.find(
        m => m.value === this.revenueChartFilter.month
      )?.name;
      return `Revenus mensuels - ${monthName} ${this.revenueChartFilter.year}`;
    } else if (this.revenueChartFilter.type === 'year') {
      return `Revenus annuels - ${this.revenueChartFilter.year}`;
    }
    return 'Revenus journaliers';
  }

  createPaymentsChart(): void {
    const ctx = document.getElementById('paymentsChart') as HTMLCanvasElement;
    if (!ctx || !this.paymentStats.payments_by_type) return;

    const labels = this.paymentStats.payments_by_type.map(p => p.type_paiement);
    const data = this.paymentStats.payments_by_type.map(p => p.total_paye);

    this.charts.payments = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Montant par type de paiement',
            data: data,
            backgroundColor: labels.map(() => this.getRandomColor()),
            borderColor: labels.map(() => this.getRandomColor()),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Répartition des Paiements',
            font: { size: 16 },
            padding: { top: 20, bottom: 10 },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const label = context.dataset.label || '';
                const value = context.raw || 0;
                return `${label}: ${this.formatCurrency(value)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => this.formatCurrency(value),
            },
          },
        },
      },
    });
  }

  createPaymentsTrendChart(): void {
    const ctx = document.getElementById('paymentsTrendChart') as HTMLCanvasElement;
    if (!ctx || !this.filteredData.filteredPaymentsByDate) {
      console.warn('Cannot create payments trend chart - missing data');
      return;
    }

    const sortedPayments = [...this.filteredData.filteredPaymentsByDate].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedPayments.map(p => {
      if (this.paymentChartFilter.type === 'month') {
        return new Date(p.date).getDate().toString();
      } else if (this.paymentChartFilter.type === 'year') {
        return this.months[new Date(p.date).getMonth()].name;
      }
      return this.datePipe.transform(p.date, 'shortDate') || '';
    });

    const amounts = sortedPayments.map(p => p.total_paye);
    const counts = sortedPayments.map(p => p.nombre_paiements);

    if (this.charts.paymentsTrend) {
      this.charts.paymentsTrend.destroy();
    }

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
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: this.getPaymentTrendTitle(),
            font: { size: 16 },
            padding: { top: 20, bottom: 10 },
          },
          tooltip: {
            callbacks: {
              label: context => {
                let label = context.dataset.label || '';
                let value = context.raw || 0;
                return `${label}: ${this.formatCurrency(value)}`;
              },
            },
          },
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Montant (TND)',
            },
            ticks: {
              callback: value => this.formatCurrency(value),
            },
          },
        },
      },
    });
  }

  getPaymentTrendTitle(): string {
    if (this.paymentChartFilter.type === 'day') {
      return `Paiements du ${this.datePipe.transform(new Date(), 'fullDate')}`;
    } else if (this.paymentChartFilter.type === 'month') {
      const monthName = this.months.find(
        m => m.value === this.paymentChartFilter.month
      )?.name;
      return `Paiements mensuels - ${monthName} ${this.paymentChartFilter.year}`;
    } else if (this.paymentChartFilter.type === 'year') {
      return `Paiements annuels - ${this.paymentChartFilter.year}`;
    }
    return 'Évolution des Paiements';
  }

  // Modifier la méthode formatCurrency pour utiliser les taux statiques
  formatCurrency(value: number | string | any): string {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numericValue)) return 'N/A';

    const convertedValue =
      numericValue * (this.exchangeRates[this.selectedCurrency] || 1);

    return (
      this.currencyPipe.transform(
        convertedValue,
        this.selectedCurrency,
        'symbol',
        '1.2-2'
      ) || ''
    );
  }

  // Ajouter une méthode pour convertir les valeurs brutes
  convertCurrency(value: number): number {
    return value * (this.exchangeRates[this.selectedCurrency] || 1);
  }

  formatDate(value: string): string {
    return this.datePipe.transform(value, 'medium') || '';
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    setTimeout(() => this.updateCharts(), 50);
  }

  getRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }
}
