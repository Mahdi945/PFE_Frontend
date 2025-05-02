import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { GestionCreditsService } from '../../services/gestion-credits.service';
import { Observable } from 'rxjs';

interface Credit {
  id: number;
  id_utilisateur: number;
  type_credit: string;
  solde_credit: number;
  date_debut: string;
  duree_credit: number;
  credit_utilise?: number;
  etat: string;
  utilisateur?: string;
}

@Component({
  selector: 'app-saisie-paiement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './saisie-paiement.component.html',
  styleUrls: ['./saisie-paiement.component.css']
})
export class SaisiePaiementComponent implements OnInit {
  activeCredits: Credit[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';

  // Modals
  showConfirmationModal: boolean = false;
  showSuccessModal: boolean = false;
  successMessage: string = '';

  // Formulaire avec initialisation correcte des types
  newPayment = {
    id_credit: null as number | null,
    montant_paye: null as number | null,
    mode_paiement: '' as 'especes' | 'carte' | 'virement' | 'cheque',
    date_paiement: new Date().toISOString().slice(0, 16),
    description: ''
  };

  constructor(
    private creditService: GestionCreditsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActiveCredits();
  }

  loadActiveCredits(): void {
    this.isLoading = true;
    this.creditService.getAllCredits().subscribe({
      next: (credits: any) => {
        this.activeCredits = Array.isArray(credits) 
          ? credits.filter((c: any) => c.etat === 'actif') 
          : [];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des crédits', err);
        this.errorMessage = 'Erreur lors du chargement des crédits actifs';
        this.isLoading = false;
      }
    });
  }

  validateForm(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    // Vérification TypeScript des valeurs non null
    if (this.newPayment.id_credit === null || this.newPayment.montant_paye === null) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    // Validation du montant par rapport au crédit disponible
    const selectedCredit = this.activeCredits.find(c => c.id === this.newPayment.id_credit);
    if (selectedCredit) {
      const reste = selectedCredit.solde_credit - (selectedCredit.credit_utilise || 0);
      if (this.newPayment.montant_paye > reste) {
        this.errorMessage = `Le montant ne peut pas dépasser le reste dû (${reste.toFixed(2)} DT)`;
        return;
      }
    }

    this.errorMessage = '';
    this.showConfirmationModal = true;
  }

  confirmPayment(): void {
    this.showConfirmationModal = false;
    this.isSaving = true;

    // Création de l'objet paymentData avec les types stricts attendus par le service
    const paymentData = {
      id_credit: this.newPayment.id_credit as number, // Conversion explicite car nous avons déjà validé que ce n'est pas null
      montant_paye: this.newPayment.montant_paye as number, // Conversion explicite
      mode_paiement: this.newPayment.mode_paiement,
      description: this.newPayment.description,
      // Note: date_paiement n'est pas inclus car non requis par le service
    };

    this.creditService.createPayment(paymentData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.successMessage = `Paiement enregistré avec succès (Réf: ${response.reference_paiement || 'N/A'})`;
        this.showSuccessModal = true;
        this.resetForm();
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Une erreur est survenue lors de l\'enregistrement';
        this.isSaving = false;
      }
    });
  }

  private resetForm(): void {
    this.newPayment = {
      id_credit: null,
      montant_paye: null,
      mode_paiement: 'especes',
      date_paiement: new Date().toISOString().slice(0, 16),
      description: ''
    };
  }

  redirectToHistory(): void {
    this.showSuccessModal = false;
 
  }

  getPaymentModeLabel(mode: string): string {
    switch(mode) {
      case 'especes': return 'Espèces';
      case 'carte': return 'Carte bancaire';
      case 'virement': return 'Virement';
      case 'cheque': return 'Chèque';
      default: return mode;
    }
  }
}