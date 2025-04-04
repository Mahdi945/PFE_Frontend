import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';
import { AffectationCalendrierService } from '../../../services/affectation-calendrier.service';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions } from '@fullcalendar/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-affectations-pompistes',
  standalone: true,
  imports: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    CommonModule,
    FullCalendarModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './gestion-affectations-pompistes.component.html',
  styleUrls: ['./gestion-affectations-pompistes.component.css']
})
export class GestionAffectationsPompistesComponent implements OnInit {
  calendarOptions!: CalendarOptions;
  mois: number = new Date().getMonth() + 1;
  annee: number = new Date().getFullYear();
  selectedDate: string = '';
  affectations: any[] = [];
  affectationToEdit: any;
  showModal: boolean = false;

  constructor(private affectationService: AffectationCalendrierService) {}

  ngOnInit(): void {
    this.loadAffectations();
  }

  loadAffectations() {
    this.affectationService.getAffectationsByMonthYear(this.mois, this.annee).subscribe(data => {
      const events = data.map((aff: any) => ({
        title: `Pompiste: ${aff.pompiste_id}, Pompe: ${aff.pompe_id}`,
        date: aff.date,
        calendrier_id: aff.calendrier_id
      }));

      this.calendarOptions = {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        events: events,
        eventClick: (info) => this.onEventClick(info.event.extendedProps['calendrier_id'])
      };
    });
  }

  onDateChange(event: any) {
    const selectedDate = event.target.value;
    this.selectedDate = selectedDate;

    this.affectationService.getCalendrierByDate(selectedDate).subscribe({
      next: (calendrier) => {
        const calendrier_id = calendrier.id;
        this.affectationService.getAffectationsByJour(calendrier_id).subscribe(data => {
          this.affectations = data;
        });
      },
      error: () => {
        this.affectations = [];
        alert('Aucune affectation trouvée pour cette date.');
      }
    });
  }

  onEventClick(calendrier_id: number) {
    this.affectationService.getAffectationsByJour(calendrier_id).subscribe(data => {
      this.affectations = data;
    });
  }

  generateAffectations() {
    const data = { mois: this.mois, annee: this.annee };
    this.affectationService.addAffectationAutomatique(data).subscribe(() => {
      alert('Affectations automatiques générées');
      this.loadAffectations();
    });
  }

  editAffectation(affectation: any) {
    this.affectationToEdit = { ...affectation };
    this.showModal = true;
  }

  closeModal() {
    this.affectationToEdit = null;
    this.showModal = false;
  }

  saveAffectation() {
    if (this.affectationToEdit) {
      this.affectationService.editAffectationManuelle(this.affectationToEdit).subscribe(() => {
        alert('Affectation modifiée avec succès');
        this.affectationToEdit = null;
        this.showModal = false;
        this.loadAffectations();
      });
    }
  }
}
