import { Component, OnInit } from '@angular/core';
import { AffectationCalendrierService } from '../../services/affectation-calendrier.service';
import { DatePipe } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface Affectation {
  id: number | null;
  pompiste: string | null;
  numero_pompe: string | null;
  poste: string | null;
  date: string | null;
  heure_debut: string | null;
  heure_fin?: string | null;
}

interface DayAffectations {
  date: string;
  items: any[];
}

@Component({
  selector: 'app-gestion-affectations-pompistes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FullCalendarModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './gestion-affectations-pompistes.component.html',
  styleUrls: ['./gestion-affectations-pompistes.component.css'],
  providers: [DatePipe]
})
export class GestionAffectationsPompistesComponent implements OnInit {
  calendarOptions!: CalendarOptions;
  currentMonth: number = new Date().getMonth() + 1;
  currentYear: number = new Date().getFullYear();
  mois: number = this.currentMonth;
  annee: number = this.currentYear;
  selectedDate: string | null = null;
  affectations: any[] = [];
  affectationToEdit: Affectation = {
    id: null,
    pompiste: null,
    numero_pompe: null,
    poste: null,
    date: null,
    heure_debut: null
  };
  showModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  showListeAffectations: boolean = false;
  listeAffectations: any[] = [];
  filteredAffectations: DayAffectations[] = [];
  allPompistes: string[] = [];
  allPompes: string[] = [];
  allPostes: string[] = [];

  constructor(
    private affectationService: AffectationCalendrierService,
    public datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.initCalendar();
    this.loadInitialData();
  }
  initCalendar() {
    this.calendarOptions = {
      plugins: [dayGridPlugin, interactionPlugin, listPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,listMonth'
      },
      dateClick: (arg) => this.handleDateClick(arg),
      eventClick: (arg) => this.handleEventClick(arg),
      events: (info, successCallback, failureCallback) => {
        this.affectationService.getAffectationsByMonthYear(this.mois, this.annee).subscribe({
          next: (data) => {
            this.listeAffectations = data;
            this.updateAllLists(data);
            const events = data.map((aff: any) => ({
              id: aff.affectation_id,
              title: aff.heure_debut && aff.heure_debut !== '00:00'
                ? `${aff.heure_debut} ${aff.pompiste || 'N/A'} (${aff.numero_pompe || 'N/A'})`
                : `${aff.pompiste || 'N/A'} (${aff.numero_pompe || 'N/A'})`,
              start: aff.date,
              backgroundColor: this.getPosteColor(aff.poste),
               display: 'block', // Force l'affichage sur toute la journée
              allDay: true, // Traite l'événement comme toute la journée
              extendedProps: {
                poste: aff.poste,
                date: aff.date,
                heure_debut: aff.heure_debut,
                pompiste: aff.pompiste,
                numero_pompe: aff.numero_pompe,
                affectation_id: aff.affectation_id
              }
            }));
            successCallback(events);
          },
          error: (err) => {
            failureCallback(err);
          }
        });
      },
      locale: 'fr',
      views: {
        listMonth: {
          type: 'list',
          
        }
      }
    };
  }

  loadInitialData() {
    this.loadAffectations();
  }

  updateAllLists(data: any[]) {
    this.allPompistes = [...new Set(data.map(aff => aff.pompiste))].filter(Boolean) as string[];
    this.allPompes = [...new Set(data.map(aff => aff.numero_pompe))].filter(Boolean) as string[];
    this.allPostes = [...new Set(data.map(aff => aff.poste))].filter(Boolean) as string[];
  }

  handleDateClick(arg: any) {
    this.selectedDate = arg.dateStr;
    this.loadAffectationsForDate(this.selectedDate);
    this.scrollToDetails();
  }

  handleEventClick(arg: any) {
    console.log('Event clicked:', arg.event);
    const eventData = arg.event.extendedProps;
    
    if (!eventData.affectation_id) {
      console.error('L\'événement n\'a pas d\'ID valide:', arg.event);
      this.showError('Impossible de modifier - événement sans ID valide');
      return;
    }

    this.selectedDate = arg.event.startStr;
    
    this.affectationToEdit = {
      id: eventData.affectation_id,
      pompiste: eventData.pompiste,
      numero_pompe: eventData.numero_pompe,
      poste: eventData.poste,
      date: eventData.date,
      heure_debut: eventData.heure_debut
    };

    console.log('Affectation à éditer:', this.affectationToEdit);
    this.showModal = true;
  }

  scrollToDetails() {
    setTimeout(() => {
      const element = document.getElementById('affectations-details');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  loadAffectations() {
    this.affectationService.getAffectationsByMonthYear(this.mois, this.annee).subscribe({
      next: (data: any[]) => {
        this.listeAffectations = data;
        this.filteredAffectations = this.organizeByDay(data);
        this.updateAllLists(data);
        this.initCalendar();
      },
      error: (err) => {
        this.showError(err.message || 'Erreur lors du chargement des affectations.');
      }
    });
  }

  loadAffectationsForDate(date: string | null) {
    if (!date) {
      this.affectations = [];
      return;
    }

    this.affectationService.getAffectationsByDate(date).subscribe({
      next: (data: any[]) => {
        this.affectations = data;
      },
      error: (err) => {
        console.error('Error loading affectations:', err);
        this.showError(err.message || 'Erreur lors du chargement des affectations.');
        this.affectations = [];
      }
    });
  }

  organizeByDay(affectations: any[]): DayAffectations[] {
    const grouped: {[key: string]: any[]} = {};
    affectations.forEach(aff => {
      const date = this.datePipe.transform(aff.date, 'yyyy-MM-dd');
      if (date) {
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(aff);
      }
    });
    return Object.entries(grouped).map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))
    }));
  }

  getPosteColor(poste: string): string {
    const colors: {[key: string]: string} = {
      'Matin': '#5E97F6',       // Bleu ciel doux
      'Après-midi': '#FF9E7D',  // Saumon chaleureux
      'Nuit': '#8BD5CA',        // Turquoise pastel
      'Autre': '#B39DDB',       // Lavande douce
      'Week-end': '#FFB74D',    // Orange doré
      'Spécial': '#A5D6A7',     // Vert menthe
      'Repos': '#90A4AE',       // Gris bleuté
      'Urgence': '#FF8A65'      // Corail vif
    };
    
    // Couleur par défaut plus douce
    return colors[poste] || '#B0BEC5'; // Gris clair bleuté
  }

  generateAffectations() {
    if (!confirm(`Voulez-vous générer les affectations automatiques pour ${this.getMonthName(this.mois)} ${this.annee} ?`)) return;

    this.affectationService.addAffectationAutomatique({ mois: this.mois, annee: this.annee }).subscribe({
      next: () => {
        this.showSuccess('Affectations générées avec succès !');
        this.loadAffectations();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Erreur lors de la génération');
      }
    });
  }

  regenerateAffectations() {
    if (!confirm(`Êtes-vous sûr de vouloir régénérer les affectations pour ${this.getMonthName(this.mois)} ${this.annee} ?`)) return;

    this.affectationService.regenerateAffectations(this.mois, this.annee).subscribe({
      next: () => {
        this.showSuccess('Affectations régénérées avec succès !');
        this.loadAffectations();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Erreur lors de la régénération');
      }
    });
  }

  toggleListeAffectations() {
    this.showListeAffectations = !this.showListeAffectations;
  }

  editAffectation(affectation: any) {
    if (!this.selectedDate) {
      this.showError('Veuillez sélectionner une date avant de modifier');
      return;
    }

    if (!affectation.affectation_id) {
      console.error('Tentative de modification sans ID:', affectation);
      this.showError('Impossible de modifier - affectation sans ID');
      return;
    }

    this.affectationToEdit = { 
      ...affectation,
      id: affectation.affectation_id,
      date: this.selectedDate
    };

    this.showModal = true;
  }

  saveAffectation() {
    if (!this.affectationToEdit?.id) {
      console.error('ID manquant pour la mise à jour:', this.affectationToEdit);
      this.showError('ID d\'affectation manquant - impossible de mettre à jour');
      return;
    }

    if (!this.selectedDate) {
      this.showError('Aucune date sélectionnée');
      return;
    }

    const updatedData = {
      id: this.affectationToEdit.id,
      pompiste: this.affectationToEdit.pompiste,
      numero_pompe: this.affectationToEdit.numero_pompe,
      poste: this.affectationToEdit.poste,
      date: this.selectedDate
      // heure_debut a été retiré comme demandé
    };

    console.log('Tentative de mise à jour avec:', updatedData);

    this.affectationService.editAffectationManuelle(updatedData).pipe(
      tap(response => {
        console.log('Mise à jour réussie:', response);
        this.showSuccess('Affectation modifiée avec succès !');
        this.closeModal();
        this.loadAffectationsForDate(this.selectedDate);
        this.loadAffectations();
      }),
      catchError(err => {
        console.error('Échec de la mise à jour:', {
          error: err,
          attemptedUpdate: updatedData
        });
        this.showError(err.error?.message || 'Échec de la mise à jour - Vérifiez les logs');
        return throwError(() => err);
      })
    ).subscribe();
  }

  closeModal() {
    this.affectationToEdit = {
      id: null,
      pompiste: null,
      numero_pompe: null,
      poste: null,
      date: null,
      heure_debut: null
    };
    this.showModal = false;
  }

  showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 4000);
  }

  getMonthName(monthNumber: number): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthNumber - 1] || '';
  }

  exportPdfMensuel() {
    if (!confirm(`Voulez-vous exporter les affectations de ${this.getMonthName(this.mois)} ${this.annee} en PDF ?`)) return;

    const doc = new jsPDF('landscape');
    const title = `Affectations mensuelles - ${this.getMonthName(this.mois)} ${this.annee}`;
    const currentDate = this.datePipe.transform(new Date(), 'dd/MM/yyyy à HH:mm') || '';

    try {
      const logo = new Image();
      logo.src = 'assets/images/logo.png';
      doc.addImage(logo, 'PNG', 15, 10, 40, 15);
    } catch (e) {
      console.warn('Logo non trouvé, continuation sans logo');
    }

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(title, doc.internal.pageSize.width / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le: ${currentDate}`, doc.internal.pageSize.width - 15, 15, { align: 'right' });

    let startY = 40;

    // Calcul de la largeur égale pour les 4 colonnes (en tenant compte des marges)
    const pageWidth = doc.internal.pageSize.width - 40; // -40 pour les marges (20 de chaque côté)
    const columnWidth = pageWidth / 4;

    this.filteredAffectations.forEach(day => {
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      
      const formattedDate = this.datePipe.transform(day.date, 'dd/MM/yyyy');
      if (formattedDate) {
        doc.text(formattedDate, 20, startY);
      }

      autoTable(doc, {
        head: [['Créneau', 'Pompiste', 'Pompe', 'Poste']],
        body: day.items.map((aff: any) => [
          aff.heure_debut && aff.heure_fin 
            ? `${aff.heure_debut} - ${aff.heure_fin}`
            : aff.heure_debut 
              ? `${aff.heure_debut}`
              : 'Journée',
          aff.pompiste || 'N/A',
          aff.numero_pompe || 'N/A',
          aff.poste || 'N/A'
        ]),
        startY: startY + 10,
        margin: { left: 20, right: 20 }, // Marges symétriques
        styles: { 
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          cellWidth: columnWidth, // Largeur égale pour toutes les cellules
          halign: 'center' // Centrage du texte
        },
        headStyles: {
          fillColor: [52, 58, 64],
          textColor: 255,
          fontStyle: 'bold',
          cellWidth: columnWidth // Largeur égale pour les en-têtes
        },
        columnStyles: {
          0: { cellWidth: columnWidth }, // Créneau
          1: { cellWidth: columnWidth }, // Pompiste
          2: { cellWidth: columnWidth }, // Pompe
          3: { cellWidth: columnWidth }  // Poste
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
          cellWidth: columnWidth // Largeur égale pour les lignes alternées
        }
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('© Votre Société - Tous droits réservés', 
            doc.internal.pageSize.width / 2, 
            doc.internal.pageSize.height - 10,
            { align: 'center' });

    doc.save(`Affectations_${this.getMonthName(this.mois)}_${this.annee}.pdf`);
    this.showSuccess('PDF généré avec succès !');
  }
}