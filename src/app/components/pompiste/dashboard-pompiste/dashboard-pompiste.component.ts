import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  LOCALE_ID,
} from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AffectationCalendrierService } from '../../../services/affectation-calendrier.service';
import { GestionCreditsService } from '../../../services/gestion-credits.service';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  CommonModule,
  DatePipe,
  CurrencyPipe,
  registerLocaleData,
} from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import localeFr from '@angular/common/locales/fr';

// Register French locale
registerLocaleData(localeFr);

@Component({
  selector: 'app-dashboard-pompiste',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './dashboard-pompiste.component.html',
  styleUrls: ['./dashboard-pompiste.component.css'],
  providers: [DatePipe, CurrencyPipe, { provide: LOCALE_ID, useValue: 'fr' }],
})
export class DashboardPompisteComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('activityChart') activityChart!: ElementRef<HTMLCanvasElement>;

  // Calendar configuration
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay',
    },
    eventClick: this.handleEventClick.bind(this),
  };

  // User and affectations data
  affectations: any[] = [];
  currentUser: any = {};
  currentUsername: string = '';
  mois: number = new Date().getMonth() + 1;
  annee: number = new Date().getFullYear();
  isLoading: boolean = true;

  // Modal properties
  selectedEvent: any = null;
  showModal: boolean = false;

  // Statistics data
  statistics = {
    totalTransactions: 0,
    totalFuelDistributed: 0,
    totalRevenue: 0,
    totalClientsServed: 0,
  };
  // Transaction stats for template binding
  transactionStats = {
    total_transactions: 0,
    total_quantite: 0,
    total_montant: 0,
    clients_servis: 0,
  };

  // Transaction data
  transactions: any[] = [];
  filteredTransactions: any[] = [];
  currentFilter: 'day' | 'month' | 'year' = 'day';
  loading: boolean = false;
  transactionsLoading: boolean = false;

  // Chart
  chart: Chart | null = null;
  pompiste: any = {};

  constructor(
    private authService: AuthService,
    private affectationService: AffectationCalendrierService,
    private gestionCreditsService: GestionCreditsService,
    private datePipe: DatePipe
  ) {
    Chart.register(...registerables);
  }
  ngOnInit(): void {
    this.loadProfile();
  }

  ngAfterViewInit(): void {
    // Chart will be initialized after data is loaded
  }

  // Gestion du clic sur un événement du calendrier
  handleEventClick(info: EventClickArg) {
    this.selectedEvent = {
      date: this.datePipe.transform(info.event.start, 'dd/MM/yyyy'),
      pompe: info.event.extendedProps['pompe'],
      poste: info.event.extendedProps['poste'],
    };
    this.showModal = true;
  }

  // Fermer le modal
  closeModal() {
    this.showModal = false;
    this.selectedEvent = null;
  }
  loadProfile() {
    this.authService.getProfile().subscribe({
      next: data => {
        if (Array.isArray(data) && data[0] && data[0][0]) {
          this.currentUser = data[0][0];
          this.pompiste = this.currentUser; // Store pompiste data
          this.currentUsername = this.currentUser.username;
          this.loadAffectationsForUser();
          this.loadTransactions();
        } else {
          console.error('Structure de données utilisateur inattendue:', data);
          this.isLoading = false;
        }
      },
      error: err => {
        console.error('Erreur lors du chargement du profil:', err);
        this.isLoading = false;
      },
    });
  }

  loadAffectationsForUser() {
    this.affectationService
      .getAffectationsByMonthYear(this.mois, this.annee)
      .subscribe({
        next: (data: any[]) => {
          this.affectations = data.filter(aff => {
            const affPompiste = aff.pompiste?.toString().toLowerCase().trim();
            const currentUser = this.currentUsername
              ?.toString()
              .toLowerCase()
              .trim();
            return affPompiste === currentUser;
          });
          this.setupCalendar(this.affectations);
          this.isLoading = false;
        },
        error: err => {
          console.error('Erreur lors du chargement des affectations:', err);
          this.isLoading = false;
        },
      });
  }

  setupCalendar(data: any[]) {
    const events = data.map((aff: any) => {
      const eventDate = this.parseDate(aff.date);

      return {
        title: `Pompe ${aff.numero_pompe} - ${aff.poste}`,
        date: eventDate,
        backgroundColor: this.getEventColor(aff.numero_pompe),
        borderColor: '#ffffff',
        textColor: '#ffffff',
        extendedProps: {
          pompiste: aff.pompiste,
          pompe: aff.numero_pompe,
          poste: aff.poste,
          date: aff.date,
        },
      };
    });

    this.calendarOptions.events = events;
  }

  private parseDate(dateString: any): Date {
    if (dateString instanceof Date) return dateString;
    if (typeof dateString === 'number') return new Date(dateString);

    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) return parsedDate;

    console.warn('Impossible de parser la date:', dateString);
    return new Date();
  }
  getMonthName(monthNumber: number): string {
    const months = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];
    return months[monthNumber - 1];
  }

  getEventColor(pompeNumber: string): string {
    const colors: { [key: string]: string } = {
      '1': '#3498db',
      '2': '#2ecc71',
      '3': '#e74c3c',
      '4': '#f39c12',
      '5': '#9b59b6',
    };
    return colors[pompeNumber] || '#34495e';
  }
  // Transaction management methods
  loadTransactions(): void {
    this.loading = true;
    this.transactionsLoading = true;
    const currentDate = new Date();
    // Build filters object based on current filter
    const filters: any = {
      type: this.currentFilter,
    };

    if (this.currentFilter === 'day') {
      filters.date = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    } else if (this.currentFilter === 'month') {
      filters.month = currentDate.getMonth() + 1;
      filters.year = currentDate.getFullYear();
    } else if (this.currentFilter === 'year') {
      filters.year = currentDate.getFullYear();
    }

    // Load transactions for current period based on filter
    this.gestionCreditsService
      .getTransactionsByPompiste(
        this.pompiste.id_pompiste || this.pompiste.id || this.currentUser.id,
        filters
      )
      .subscribe({
        next: response => {
          console.log('Response from service:', response);

          // Handle the new response structure based on the log
          if (response && response.success && response.data) {
            // Extract transactions from response.data.transactions
            this.transactions = Array.isArray(response.data.transactions)
              ? response.data.transactions
              : [];

            // Extract statistics from response.data.statistiques.globales
            if (response.data.statistiques && response.data.statistiques.globales) {
              const stats = response.data.statistiques.globales;
              this.transactionStats = {
                total_transactions: stats.total_transactions || 0,
                total_quantite: stats.total_quantite || 0,
                total_montant: stats.total_montant || 0,
                clients_servis: stats.clients_servis || this.getUniqueClientsCount(),
              };

              // Also update the legacy statistics object
              this.statistics = {
                totalTransactions: stats.total_transactions || 0,
                totalFuelDistributed: stats.total_quantite || 0,
                totalRevenue: stats.total_montant || 0,
                totalClientsServed:
                  stats.clients_servis || this.getUniqueClientsCount(),
              };
            } else {
              // Fallback: calculate statistics from transactions
              this.calculateStatistics();
            }
          } else if (Array.isArray(response)) {
            // Fallback for old API structure
            this.transactions = response;
            this.calculateStatistics();
          } else {
            // Another fallback
            this.transactions = response?.transactions || [];
            this.calculateStatistics();
          }

          this.filteredTransactions = [...this.transactions];
          this.initializeChart();
          this.loading = false;
          this.transactionsLoading = false;

          console.log('Loaded transactions:', this.transactions);
          console.log('Statistics:', this.transactionStats);
        },
        error: err => {
          console.error('Erreur lors du chargement des transactions:', err);
          this.transactions = [];
          this.filteredTransactions = [];
          this.transactionStats = {
            total_transactions: 0,
            total_quantite: 0,
            total_montant: 0,
            clients_servis: 0,
          };
          this.loading = false;
          this.transactionsLoading = false;
        },
      });
  }

  setFilter(filter: 'day' | 'month' | 'year'): void {
    this.currentFilter = filter;
    this.loadTransactions();
  }
  calculateStatistics(): void {
    // Ensure transactions is an array
    if (!Array.isArray(this.transactions) || this.transactions.length === 0) {
      this.statistics = {
        totalTransactions: 0,
        totalFuelDistributed: 0,
        totalRevenue: 0,
        totalClientsServed: 0,
      };
      this.transactionStats = {
        total_transactions: 0,
        total_quantite: 0,
        total_montant: 0,
        clients_servis: 0,
      };
      return;
    }

    // Calculate statistics safely
    const totalTransactions = this.transactions.length;
    const totalFuelDistributed = this.transactions.reduce((sum, t) => {
      const quantite = parseFloat(t.quantite) || 0;
      return sum + quantite;
    }, 0);
    const totalRevenue = this.transactions.reduce((sum, t) => {
      const montant = parseFloat(t.montant) || 0;
      return sum + montant;
    }, 0);

    // Count unique clients
    const uniqueClients = new Set();
    this.transactions.forEach(t => {
      if (t.client_id) uniqueClients.add(t.client_id);
      else if (t.client) uniqueClients.add(t.client);
      else if (t.client_username) uniqueClients.add(t.client_username);
    });

    this.statistics = {
      totalTransactions,
      totalFuelDistributed,
      totalRevenue,
      totalClientsServed: uniqueClients.size,
    };

    // Update transactionStats for template binding
    this.transactionStats = {
      total_transactions: totalTransactions,
      total_quantite: totalFuelDistributed,
      total_montant: totalRevenue,
      clients_servis: uniqueClients.size,
    };

    console.log('Calculated statistics:', this.transactionStats);
  }

  initializeChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.activityChart?.nativeElement) {
      setTimeout(() => this.initializeChart(), 100);
      return;
    }

    const ctx = this.activityChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Prepare chart data based on current filter
    const chartData = this.prepareChartData();

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Transactions',
            data: chartData.data,
            borderColor: '#4F46E5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#4F46E5',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
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
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              color: '#6B7280',
            },
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              color: '#6B7280',
            },
          },
        },
        elements: {
          point: {
            hoverBackgroundColor: '#4F46E5',
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }
  prepareChartData(): { labels: string[]; data: number[] } {
    if (!Array.isArray(this.transactions) || this.transactions.length === 0) {
      return { labels: [], data: [] };
    }

    const groupedData: { [key: string]: number } = {};

    this.transactions.forEach(transaction => {
      let key: string;
      const dateField =
        transaction.date_transaction || transaction.date || transaction.created_at;

      if (!dateField) {
        console.warn('No date field found in transaction:', transaction);
        return;
      }

      const date = new Date(dateField);

      if (isNaN(date.getTime())) {
        console.warn('Invalid date in transaction:', dateField);
        return;
      }

      switch (this.currentFilter) {
        case 'day':
          key = `${date.getHours().toString().padStart(2, '0')}h`;
          break;
        case 'month':
          key = `${date.getDate()}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'year':
          key = this.getMonthName(date.getMonth() + 1);
          break;
        default:
          key = date.toLocaleDateString('fr-FR');
      }

      groupedData[key] = (groupedData[key] || 0) + 1;
    });

    const labels = Object.keys(groupedData).sort();
    const data = labels.map(label => groupedData[label]);

    return { labels, data };
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      Payé: 'bg-success',
      'En attente': 'bg-warning',
      Annulé: 'bg-danger',
      Remboursé: 'bg-info',
    };
    return statusClasses[status] || 'bg-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace('TND', 'DT');
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  getUniqueClientsCount(): number {
    if (!Array.isArray(this.transactions) || this.transactions.length === 0) {
      return 0;
    }

    const uniqueClients = new Set();
    this.transactions.forEach(t => {
      if (t.client_id) uniqueClients.add(t.client_id);
      else if (t.client) uniqueClients.add(t.client);
      else if (t.client_username) uniqueClients.add(t.client_username);
    });

    return uniqueClients.size;
  }
}
