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
  affectationToEdit: any = null; // Initialisé à null pour éviter les erreurs
  showModal: boolean = false; // Contrôle l'affichage du modal

  // ✅ Messages Bootstrap
  successMessage: string = '';
  errorMessage: string = '';

  // Données dynamiques pour les options de modification dans le modal
  uniquePompistes: string[] = [];
  uniquePompes: string[] = [];
  uniquePostes: string[] = [];

  constructor(private affectationService: AffectationCalendrierService) {}

  ngOnInit(): void {
    
  }

  // ✅ Helpers pour les messages
  showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => (this.errorMessage = ''), 4000);
  }

  // ✅ Chargement des affectations
  loadAffectations() {
    this.affectationService.getAffectationsByMonthYear(this.mois, this.annee).subscribe({
      next: (data: any[]) => {
        console.log('Données des affectations chargées :', data); // Ajout pour débogage
        this.affectations = data;

        // Mappage des événements pour le calendrier
        const events = data.map((aff: any) => ({
          title: `Pompiste: ${aff.pompiste}, Pompe: ${aff.numero_pompe}`,
          date: aff.date,
          calendrier_id: aff.calendrier_id
        }));

        this.calendarOptions = {
          plugins: [dayGridPlugin, interactionPlugin],
          initialView: 'dayGridMonth',
          events: events,
          eventClick: (info) => this.onEventClick(info.event.extendedProps['calendrier_id'])
        };

        // Extraire les données uniques des affectations pour remplir les listes dynamiquement
        this.uniquePompistes = [...new Set(data.map((aff: any) => aff.pompiste as string))];
        this.uniquePompes = [...new Set(data.map((aff: any) => aff.numero_pompe as string))];
        this.uniquePostes = [...new Set(data.map((aff: any) => aff.poste as string))];
      },
      error: () => {
        this.showError('❌ Erreur lors du chargement des affectations du calendrier.');
      }
    });
  }

  // ✅ Clic sur un jour du calendrier
  onEventClick(calendrier_id: number) {
    this.affectationService.getAffectationsByJour(calendrier_id).subscribe({
      next: (data: any[]) => {
        this.affectations = data;
      },
      error: () => {
        this.showError('❌ Erreur lors du chargement des affectations pour cette journée.');
      }
    });
  }

  // ✅ Changement de date manuelle
  onDateChange(event: any) {
    const selectedDate = event.target.value;
    this.selectedDate = selectedDate;

    this.affectationService.getCalendrierByDate(selectedDate).subscribe({
      next: (calendrier: any) => {
        const calendrier_id = calendrier.id;
        this.affectationService.getAffectationsByJour(calendrier_id).subscribe({
          next: (data: any[]) => {
            this.affectations = data;
            // Mise à jour des listes dynamiques après changement de date
            this.uniquePompistes = [...new Set(data.map((aff: any) => aff.pompiste as string))];
            this.uniquePompes = [...new Set(data.map((aff: any) => aff.numero_pompe as string))];
            this.uniquePostes = [...new Set(data.map((aff: any) => aff.poste as string))];
          },
          error: () => {
            this.affectations = [];
            this.showError('❌ Aucune affectation trouvée pour cette date.');
          }
        });
      },
      error: () => {
        this.affectations = [];
        this.showError('❌ Date invalide ou non trouvée dans le calendrier.');
      }
    });
  }

  generateAffectations() {
    const data = { mois: this.mois, annee: this.annee };
    this.affectationService.addAffectationAutomatique(data).subscribe({
      next: () => {
        this.showSuccess('✅ Affectations automatiques générées avec succès.');
        this.loadAffectations();
      },
      error: (errorResponse) => {
        if (errorResponse.status === 400) {
          this.showError(errorResponse.error.message || '❌ Erreur inconnue.');
        } else {
          this.showError('❌ les affectations de ce mois sont deja generés.');
        }
      }
    });
  }

  // ✅ Edition
  editAffectation(affectation: any) {
    console.log('Affectation sélectionnée :', affectation); // Ajout pour débogage

    if (!affectation || !affectation.affectation_id) {
      this.showError('❌ Affectation invalide ou ID manquant.');
      return;
    }

    // Copie des données pour éviter les modifications directes
    this.affectationToEdit = {
      id: affectation.affectation_id, // Assurez-vous que l'ID est bien mappé
      pompiste: affectation.pompiste,
      numero_pompe: affectation.numero_pompe,
      poste: affectation.poste,
      calendrier_id: affectation.calendrier_id
    };

    console.log('Affectation à éditer :', this.affectationToEdit); // Vérifiez si l'ID est bien défini
    this.showModal = true; // Ouvrir le modal
  }

  // ✅ Fermeture de la fenêtre
  closeModal() {
    console.log('Fermeture du modal'); // Ajout pour débogage
    this.affectationToEdit = null;
    this.showModal = false;
  }

  saveAffectation() {
    if (this.affectationToEdit) {
      const { id, pompiste, numero_pompe, poste, calendrier_id } = this.affectationToEdit;
  
      // Vérifiez qu'au moins un champ est modifié
      if (!id) {
        this.showError('❌ L\'ID de l\'affectation est requis.');
        return;
      }
  
      // Préparer les données à envoyer
      const dataToSend: any = {
        pompiste,
        numero_pompe,
        poste,
        calendrier_id
      };
  
      console.log('Données envoyées pour l\'update :', dataToSend);
  
      // Appeler le service pour effectuer l'update
      this.affectationService.editAffectationManuelle({ id, ...dataToSend }).subscribe({
        next: () => {
          this.showSuccess('✅ Affectation modifiée avec succès.');
          this.closeModal();
          // Rafraîchir la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      },
        error: (error) => {
          console.error('Erreur lors de la modification :', error);
          this.showError('❌ Erreur lors de la modification de l\'affectation.');
        }
      });
    }
  }
}

