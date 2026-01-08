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
    FooterComponent,
  ],
  templateUrl: './gestion-affectations-pompistes.component.html',
  styleUrls: ['./gestion-affectations-pompistes.component.css'],
  providers: [DatePipe],
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
    heure_debut: null,
  };
  showModal: boolean = false;
  showConfirmationModal: boolean = false;
  showMessageModal: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  isSuccessMessage: boolean = false;
  showListeAffectations: boolean = false;
  listeAffectations: any[] = [];
  filteredAffectations: DayAffectations[] = [];
  allPompistes: string[] = [];
  allPompes: string[] = [];
  allPostes: string[] = [];
  confirmationAction: () => void = () => {};
  currentDate: Date = new Date();

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
        right: 'dayGridMonth,listMonth',
      },
      dateClick: arg => this.handleDateClick(arg),
      eventClick: arg => this.handleEventClick(arg),
      events: (info, successCallback, failureCallback) => {
        this.affectationService
          .getAffectationsByMonthYear(this.mois, this.annee)
          .subscribe({
            next: data => {
              this.listeAffectations = data;
              this.updateAllLists(data);
              const events = data.map((aff: any) => ({
                id: aff.affectation_id,
                title:
                  aff.heure_debut && aff.heure_debut !== '00:00'
                    ? `${aff.heure_debut} ${aff.pompiste || 'N/A'} (${aff.numero_pompe || 'N/A'})`
                    : `${aff.pompiste || 'N/A'} (${aff.numero_pompe || 'N/A'})`,
                start: aff.date,
                backgroundColor: this.getPosteColor(aff.poste),
                display: 'block',
                allDay: true,
                extendedProps: {
                  poste: aff.poste,
                  date: aff.date,
                  heure_debut: aff.heure_debut,
                  pompiste: aff.pompiste,
                  numero_pompe: aff.numero_pompe,
                  affectation_id: aff.affectation_id,
                },
              }));
              successCallback(events);
            },
            error: err => {
              failureCallback(err);
            },
          });
      },
      locale: 'fr',
      views: {
        listMonth: {
          type: 'list',
        },
      },
    };
  }

  loadInitialData() {
    this.loadAffectations();
  }

  updateAllLists(data: any[]) {
    this.allPompistes = [...new Set(data.map(aff => aff.pompiste))].filter(
      Boolean
    ) as string[];
    this.allPompes = [...new Set(data.map(aff => aff.numero_pompe))].filter(
      Boolean
    ) as string[];
    this.allPostes = [...new Set(data.map(aff => aff.poste))].filter(
      Boolean
    ) as string[];
  }

  handleDateClick(arg: any) {
    this.selectedDate = arg.dateStr;
    this.loadAffectationsForDate(this.selectedDate);
    this.scrollToDetails();
  }

  handleEventClick(arg: any) {
    const eventData = arg.event.extendedProps;

    if (!eventData.affectation_id) {
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
      heure_debut: eventData.heure_debut,
    };

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
    this.affectationService
      .getAffectationsByMonthYear(this.mois, this.annee)
      .subscribe({
        next: (data: any[]) => {
          this.listeAffectations = data;
          this.filteredAffectations = this.organizeByDay(data);
          this.updateAllLists(data);
          this.refreshCalendar();
        },
        error: err => {
          this.showError(
            err.message || 'Erreur lors du chargement des affectations.'
          );
        },
      });
  }

  refreshCalendar() {
    if (this.calendarOptions && this.calendarOptions.events) {
      this.calendarOptions.events = (info, successCallback, failureCallback) => {
        this.loadCalendarEvents(successCallback, failureCallback);
      };
    }
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
      error: err => {
        console.error('Error loading affectations:', err);
        this.showError(err.message || 'Erreur lors du chargement des affectations.');
        this.affectations = [];
      },
    });
  }

  organizeByDay(affectations: any[]): DayAffectations[] {
    const grouped: { [key: string]: any[] } = {};
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
      items: items.sort((a, b) =>
        (a.heure_debut || '').localeCompare(b.heure_debut || '')
      ),
    }));
  }

  getPosteColor(poste: string): string {
    const colors: { [key: string]: string } = {
      Matin: '#5E97F6',
      'Après-midi': '#FF9E7D',
      Nuit: '#8BD5CA',
      Autre: '#B39DDB',
      'Week-end': '#FFB74D',
      Spécial: '#A5D6A7',
      Repos: '#90A4AE',
      Urgence: '#FF8A65',
    };
    return colors[poste] || '#B0BEC5';
  }

  isPastFirstDayOfSelectedMonth(): boolean {
    const today = new Date();
    const selectedMonthFirstDay = new Date(this.annee, this.mois - 1, 1);
    return today > selectedMonthFirstDay;
  }

  showConfirmation(message: string, action: () => void) {
    this.modalTitle = 'Confirmation';
    this.modalMessage = message;
    this.isSuccessMessage = false;
    this.confirmationAction = action;
    this.showConfirmationModal = true;
  }

  showSuccess(message: string) {
    this.modalTitle = 'Succès';
    this.modalMessage = message;
    this.isSuccessMessage = true;
    this.showMessageModal = true;
  }

  showError(message: string) {
    this.modalTitle = 'Erreur';
    this.modalMessage = message;
    this.isSuccessMessage = false;
    this.showMessageModal = true;
  }

  closeModals() {
    this.showModal = false;
    this.showConfirmationModal = false;
    this.showMessageModal = false;
  }

  onModalOverlayClick(event: Event) {
    // Fermer le modal seulement si on clique sur l'overlay, pas sur le contenu
    if (event.target === event.currentTarget) {
      this.closeModals();
    }
  }

  executeAction() {
    this.confirmationAction();
    this.showConfirmationModal = false;
  }

  // Ajoutez cette méthode pour obtenir le nombre de jours dans un mois
  getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
  }

  // Modifiez la méthode generateAffectations()
  generateAffectations() {
    const daysInMonth = this.getDaysInMonth(this.mois, this.annee);
    const message = `Voulez-vous générer les affectations automatiques pour ${this.getMonthName(this.mois)} ${this.annee} (${daysInMonth} jours) ?`;

    this.showConfirmation(message, () => {
      this.affectationService
        .addAffectationAutomatique(this.mois, this.annee)
        .subscribe({
          next: response => {
            // Vérification que tous les jours ont des affectations
            this.verifyMonthCoverage(daysInMonth);
            this.showSuccess(
              response.message || 'Affectations générées avec succès !'
            );
            this.loadAffectations();
          },
          error: err => {
            console.error('Erreur lors de la génération:', err);
            this.showError(
              err.error?.message || 'Erreur lors de la génération des affectations'
            );
          },
        });
    });
  }

  // Ajoutez cette méthode pour vérifier la couverture du mois
  verifyMonthCoverage(daysInMonth: number) {
    setTimeout(() => {
      this.affectationService
        .getAffectationsByMonthYear(this.mois, this.annee)
        .subscribe({
          next: data => {
            const daysWithAffectations = new Set<string>();

            data.forEach((aff: { date: string | number | Date }) => {
              const day = new Date(aff.date).getDate();
              daysWithAffectations.add(day.toString());
            });

            if (daysWithAffectations.size < daysInMonth) {
              const missingDays = [];
              for (let day = 1; day <= daysInMonth; day++) {
                if (!daysWithAffectations.has(day.toString())) {
                  missingDays.push(day);
                }
              }
              this.showError(
                `Attention : ${missingDays.length} jours sans affectation (${missingDays.join(', ')})`
              );
            }
          },
          error: err => {
            console.error('Erreur vérification couverture:', err);
          },
        });
    }, 1000);
  }

  // Modifiez également regenerateAffectations() de la même manière
  regenerateAffectations() {
    const daysInMonth = this.getDaysInMonth(this.mois, this.annee);
    const message = `Êtes-vous sûr de vouloir régénérer les affectations pour ${this.getMonthName(this.mois)} ${this.annee} (${daysInMonth} jours) ?`;

    this.showConfirmation(message, () => {
      this.affectationService
        .regenerateAffectations(this.mois, this.annee)
        .subscribe({
          next: response => {
            // Vérification que tous les jours ont des affectations
            this.verifyMonthCoverage(daysInMonth);
            this.showSuccess(
              response.message || 'Affectations régénérées avec succès !'
            );
            this.loadAffectations();
          },
          error: err => {
            console.error('Erreur lors de la régénération:', err);
            this.showError(
              err.error?.message || 'Erreur lors de la régénération des affectations'
            );
          },
        });
    });
  }

  private loadCalendarEvents(successCallback: Function, failureCallback: Function) {
    this.affectationService
      .getAffectationsByMonthYear(this.mois, this.annee)
      .subscribe({
        next: data => {
          this.listeAffectations = data;
          const events = data.map((aff: any) => ({
            id: aff.affectation_id,
            title:
              aff.heure_debut && aff.heure_debut !== '00:00'
                ? `${aff.heure_debut} ${aff.pompiste || 'N/A'} (${aff.numero_pompe || 'N/A'})`
                : `${aff.pompiste || 'N/A'} (${aff.numero_pompe || 'N/A'})`,
            start: aff.date,
            backgroundColor: this.getPosteColor(aff.poste),
            display: 'block',
            allDay: true,
            extendedProps: {
              poste: aff.poste,
              date: aff.date,
              heure_debut: aff.heure_debut,
              pompiste: aff.pompiste,
              numero_pompe: aff.numero_pompe,
              affectation_id: aff.affectation_id,
            },
          }));
          successCallback(events);
        },
        error: err => {
          failureCallback(err);
        },
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
      this.showError('Impossible de modifier - affectation sans ID');
      return;
    }

    this.affectationToEdit = {
      ...affectation,
      id: affectation.affectation_id,
      date: this.selectedDate,
    };

    this.showModal = true;
  }

  saveAffectation() {
    if (!this.affectationToEdit?.id) {
      this.showError("ID d'affectation manquant - impossible de mettre à jour");
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
      date: this.selectedDate,
    };

    this.affectationService
      .editAffectationManuelle(updatedData)
      .pipe(
        tap(response => {
          this.showSuccess('Affectation modifiée avec succès !');
          this.closeModals();
          this.loadAffectationsForDate(this.selectedDate);
          this.loadAffectations();
        }),
        catchError(err => {
          this.showError(
            err.error?.message || 'Échec de la mise à jour - Vérifiez les logs'
          );
          return throwError(() => err);
        })
      )
      .subscribe();
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
    return months[monthNumber - 1] || '';
  }

  exportPdfMensuel() {
    const message = `Voulez-vous exporter les affectations de ${this.getMonthName(this.mois)} ${this.annee} en PDF ?`;
    this.showConfirmation(message, () => {
      const doc = new jsPDF('landscape');
      const title = `Affectations mensuelles - ${this.getMonthName(this.mois)} ${this.annee}`;
      const currentDate =
        this.datePipe.transform(new Date(), 'dd/MM/yyyy à HH:mm') || '';

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
      doc.text(`Généré le: ${currentDate}`, doc.internal.pageSize.width - 15, 15, {
        align: 'right',
      });

      let startY = 40;
      const pageWidth = doc.internal.pageSize.width - 40;
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
            aff.poste || 'N/A',
          ]),
          startY: startY + 10,
          margin: { left: 20, right: 20 },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            cellWidth: columnWidth,
            halign: 'center',
          },
          headStyles: {
            fillColor: [52, 58, 64],
            textColor: 255,
            fontStyle: 'bold',
            cellWidth: columnWidth,
          },
          columnStyles: {
            0: { cellWidth: columnWidth },
            1: { cellWidth: columnWidth },
            2: { cellWidth: columnWidth },
            3: { cellWidth: columnWidth },
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
            cellWidth: columnWidth,
          },
        });

        startY = (doc as any).lastAutoTable.finalY + 10;
      });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        '© Votre Société - Tous droits réservés',
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );

      doc.save(`Affectations_${this.getMonthName(this.mois)}_${this.annee}.pdf`);
      this.showSuccess('PDF généré avec succès !');
    });
  }
}
