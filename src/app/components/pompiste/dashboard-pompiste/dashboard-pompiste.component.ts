import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AffectationCalendrierService } from '../../../services/affectation-calendrier.service';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule, DatePipe } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';

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
  providers: [DatePipe]
})
export class DashboardPompisteComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay'
    },
    
    eventClick: this.handleEventClick.bind(this)
  };
  
  affectations: any[] = [];
  currentUser: any = {};
  currentUsername: string = '';
  mois: number = new Date().getMonth() + 1;
  annee: number = new Date().getFullYear();
  isLoading: boolean = true;
  
  // Propriété pour stocker l'événement sélectionné
  selectedEvent: any = null;
  showModal: boolean = false;

  constructor(
    private authService: AuthService,
    private affectationService: AffectationCalendrierService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    
  }
  

  // Gestion du clic sur un événement du calendrier
  handleEventClick(info: EventClickArg) {
    this.selectedEvent = {
      date: this.datePipe.transform(info.event.start, 'dd/MM/yyyy'),
      pompe: info.event.extendedProps['pompe'],
      poste: info.event.extendedProps['poste']
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
      next: (data) => {
        if (Array.isArray(data) && data[0] && data[0][0]) {
          this.currentUser = data[0][0];
          this.currentUsername = this.currentUser.username;
          this.loadAffectationsForUser();
        } else {
          console.error('Structure de données utilisateur inattendue:', data);
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.isLoading = false;
      }
    });
  }

  loadAffectationsForUser() {
    this.affectationService.getAffectationsByMonthYear(this.mois, this.annee).subscribe({
      next: (data: any[]) => {
        this.affectations = data.filter(aff => {
          const affPompiste = aff.pompiste?.toString().toLowerCase().trim();
          const currentUser = this.currentUsername?.toString().toLowerCase().trim();
          return affPompiste === currentUser;
        });
        this.setupCalendar(this.affectations);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des affectations:', err);
        this.isLoading = false;
      }
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
          date: aff.date
        }
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
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthNumber - 1];
  }

  getEventColor(pompeNumber: string): string {
    const colors: {[key: string]: string} = {
      '1': '#3498db',
      '2': '#2ecc71',
      '3': '#e74c3c',
      '4': '#f39c12',
      '5': '#9b59b6'
    };
    return colors[pompeNumber] || '#34495e';
  }
}