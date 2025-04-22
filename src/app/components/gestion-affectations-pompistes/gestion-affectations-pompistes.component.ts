import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { AffectationCalendrierService } from '../../services/affectation-calendrier.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions } from '@fullcalendar/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  styleUrls: ['./gestion-affectations-pompistes.component.css'],
  providers: [DatePipe]
})
export class GestionAffectationsPompistesComponent implements OnInit {
  calendarOptions!: CalendarOptions;
  mois: number = new Date().getMonth() + 1;
  annee: number = new Date().getFullYear();
  selectedDate: string = '';
  affectations: any[] = [];
  affectationToEdit: any = null;
  showModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  uniquePompistes: string[] = [];
  uniquePompes: string[] = [];
  uniquePostes: string[] = [];

  constructor(
    private affectationService: AffectationCalendrierService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {}

  showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => (this.errorMessage = ''), 4000);
  }

  loadAffectations() {
    this.affectationService.getAffectationsByMonthYear(this.mois, this.annee).subscribe({
      next: (data: any[]) => {
        this.affectations = data;
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

        this.uniquePompistes = [...new Set(data.map((aff: any) => aff.pompiste as string))];
        this.uniquePompes = [...new Set(data.map((aff: any) => aff.numero_pompe as string))];
        this.uniquePostes = [...new Set(data.map((aff: any) => aff.poste as string))];
      },
      error: () => {
        this.showError('❌ Erreur lors du chargement des affectations du calendrier.');
      }
    });
  }

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

  onDateChange(event: any) {
    const selectedDate = event.target.value;
    this.selectedDate = selectedDate;

    this.affectationService.getCalendrierByDate(selectedDate).subscribe({
      next: (calendrier: any) => {
        const calendrier_id = calendrier.id;
        this.affectationService.getAffectationsByJour(calendrier_id).subscribe({
          next: (data: any[]) => {
            this.affectations = data;
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
    if (!confirm('Voulez-vous générer les affectations automatiques pour ce mois ?')) {
      return;
    }

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
          this.showError('❌ Les affectations de ce mois sont déjà générées.');
        }
      }
    });
  }
  // Ajouter cette méthode
regenerateAffectations() {
  if (confirm('Êtes-vous sûr de vouloir régénérer les affectations ? Toutes les affectations existantes pour ce mois seront supprimées.')) {
   
    
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
}
  editAffectation(affectation: any) {
    if (!affectation || !affectation.affectation_id) {
      this.showError('❌ Affectation invalide ou ID manquant.');
      return;
    }

    this.affectationToEdit = {
      id: affectation.affectation_id,
      pompiste: affectation.pompiste,
      numero_pompe: affectation.numero_pompe,
      poste: affectation.poste,
      calendrier_id: affectation.calendrier_id
    };

    this.showModal = true;
  }

  closeModal() {
    this.affectationToEdit = null;
    this.showModal = false;
  }
  saveAffectation() {
    if (this.affectationToEdit) {
      const { id, pompiste, numero_pompe, poste, calendrier_id } = this.affectationToEdit;
  
      if (!id) {
        this.showError('❌ L\'ID de l\'affectation est requis.');
        return;
      }
  
      const dataToSend: any = { 
        pompiste, 
        numero_pompe, 
        poste, 
        calendrier_id 
      };
  
      this.affectationService.editAffectationManuelle({ id, ...dataToSend }).subscribe({
        next: () => {
          this.showSuccess('✅ Affectation modifiée avec succès.');
          this.closeModal();
          // Recharger les données après un court délai
          setTimeout(() => {
            if (this.selectedDate) {
              this.onDateChange({ target: { value: this.selectedDate } });
            } else {
              this.loadAffectations();
            }
          }, 1000);
        },
        error: (error) => {
          console.error('Erreur lors de la modification :', error);
          this.showError(error.error?.message || '❌ Erreur lors de la modification de l\'affectation.');
        }
      });
    }
  }

  exportPdfMensuel() {
    if (!confirm('Voulez-vous exporter les affectations mensuelles en PDF ?')) {
      return;
    }

    this.affectationService.getAffectationsByMonthYear(this.mois, this.annee).subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response)) {
          this.generatePdf(response);
        } else {
          this.showError('❌ Aucune donnée disponible pour l\'exportation PDF');
        }
      },
      error: (err) => {
        console.error('Erreur API:', err);
        this.showError('❌ Erreur lors de la récupération des données pour le PDF');
      }
    });
  }

  private generatePdf(affectations: any[]) {
    if (!affectations || affectations.length === 0) {
      this.showError('Aucune affectation à exporter');
      return;
    }

    const doc = new jsPDF('landscape');
    const title = `Affectations mensuelles - ${this.getMonthName(this.mois)} ${this.annee}`;

    try {
      const logo = new Image();
      logo.src = '/assets/images/logo.png';
      doc.addImage(logo, 'PNG', 15, 10, 40, 15);
    } catch (e) {
      console.warn('Logo non trouvé, continuation sans logo');
    }

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le: ${this.datePipe.transform(new Date(), 'dd/MM/yyyy à HH:mm')}`, 260, 15, { align: 'right' });

    const affectationsParJour = this.organiserParJour(affectations);
    let yPosition = 40;

    Object.keys(affectationsParJour).forEach(jour => {
      const affectationsDuJour = affectationsParJour[jour];
      
      if (!affectationsDuJour || !Array.isArray(affectationsDuJour)) {
        return;
      }

      const data = affectationsDuJour.map((aff: any) => [
        aff.pompiste || 'N/A',
        aff.numero_pompe || 'N/A',
        aff.poste || 'N/A'
      ]);

      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(jour, 20, yPosition);
      yPosition += 8;

      autoTable(doc, {
        head: [['Pompiste', 'Pompe', 'Poste']],
        body: data,
        startY: yPosition,
        margin: { left: 20 },
        styles: { 
          fontSize: 10,
          cellPadding: 4,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [52, 58, 64],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      if (yPosition > 180) {
        doc.addPage('landscape');
        yPosition = 20;
      }
    });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('© Carbotrack - Tous droits réservés', 20, doc.internal.pageSize.height - 10);

    doc.save(`Affectations_${this.mois}_${this.annee}.pdf`);
  }

  public getMonthName(monthNumber: number): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthNumber - 1];
  }

  private organiserParJour(affectations: any[]): { [key: string]: any[] } {
    if (!affectations || !Array.isArray(affectations)) {
      return {};
    }

    return affectations.reduce((acc, aff) => {
      if (!aff || !aff.date) return acc;

      try {
        const date = new Date(aff.date);
        const dateStr = this.datePipe.transform(date, 'dd/MM/yyyy') || 'Date_inconnue';
        
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(aff);
      } catch (e) {
        console.error('Erreur de format de date', aff.date);
      }

      return acc;
    }, {} as { [key: string]: any[] });
  }
}