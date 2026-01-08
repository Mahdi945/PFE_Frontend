import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { GestionCreditsService } from '../../services/gestion-credits.service';
import { AuthService } from '../../services/auth.service';

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
  montant_restant: number;
}

@Component({
  selector: 'app-saisie-paiement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './saisie-paiement.component.html',
  styleUrls: ['./saisie-paiement.component.css'],
})
export class SaisiePaiementComponent implements OnInit, OnDestroy {
  activeCredits: Credit[] = [];
  filteredCredits: Credit[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  currentUser: any = null;

  // Autocomplete properties
  searchTerm: string = '';
  showDropdown: boolean = false;
  selectedCredit: Credit | null = null;

  // Modals
  showConfirmationModal: boolean = false;
  showSuccessModal: boolean = false;
  successMessage: string = '';
  private successModalTimer: any = null;
  countdownSeconds: number = 3;

  // Formulaire avec initialisation correcte des types
  newPayment = {
    id_credit: null as number | null,
    montant_paye: null as number | null,
    mode_paiement: 'especes' as 'especes' | 'carte' | 'virement' | 'cheque',
    date_paiement: new Date().toISOString().slice(0, 16),
    description: '',
  };

  constructor(
    private creditService: GestionCreditsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadActiveCredits();
  }

  loadCurrentUser(): void {
    this.authService.getProfile().subscribe({
      next: data => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.currentUser = Array.isArray(data) ? data[0][0] || data[0] : data;
        }
      },
      error: err => {
        console.error('Erreur lors du chargement du profil utilisateur', err);
      },
    });
  }

  loadActiveCredits(): void {
    this.isLoading = true;
    this.creditService.getAllCredits().subscribe({
      next: (credits: any) => {
        this.activeCredits = Array.isArray(credits)
          ? credits.filter((c: any) => c.etat === 'actif')
          : [];
        this.filteredCredits = this.activeCredits;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des crédits', err);
        this.errorMessage = 'Erreur lors du chargement des crédits actifs';
        this.isLoading = false;
      },
    });
  }

  validateForm(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (
      this.newPayment.id_credit === null ||
      this.newPayment.montant_paye === null
    ) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    const selectedCredit = this.activeCredits.find(
      c => c.id === this.newPayment.id_credit
    );
    if (selectedCredit) {
      const reste =
        selectedCredit.solde_credit - (selectedCredit.credit_utilise || 0);
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

    const paymentData = {
      id_credit: this.newPayment.id_credit as number,
      montant_paye: this.newPayment.montant_paye as number,
      mode_paiement: this.newPayment.mode_paiement,
      description: this.newPayment.description,
      id_caissier:
        this.currentUser?.role === 'caissier' ? this.currentUser.id : null,
    };

    console.log('Envoi des données de paiement:', paymentData);

    this.creditService.createPayment(paymentData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        const caissierInfo = response.id_caissier
          ? ' (Caissier: ' + response.caissier_username + ')'
          : '';
        this.successMessage = `Paiement enregistré avec succès${caissierInfo} (Réf: ${response.reference_paiement || 'N/A'})`;
        this.showSuccessModal = true;
        this.resetForm();
        
        // Start countdown
        this.countdownSeconds = 3;
        this.startCountdown();
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage =
          err.error?.message || "Une erreur est survenue lors de l'enregistrement";
        console.error('Erreur détaillée:', err);
      },
    });
  }

  private  resetForm(): void {
    this.newPayment = {
      id_credit: null,
      montant_paye: null,
      mode_paiement: 'especes',
      date_paiement: new Date().toISOString().slice(0, 16),
      description: '',
    };
    
    // Reset autocomplete properties
    this.searchTerm = '';
    this.selectedCredit = null;
    this.showDropdown = false;
    this.filteredCredits = this.activeCredits;
  }

  // Autocomplete methods
  filterCredits(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCredits = this.activeCredits;
    } else {
      this.filteredCredits = this.activeCredits.filter(credit =>
        credit.utilisateur?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        credit.id.toString().includes(this.searchTerm)
      );
    }
  }

  onSearchInput(event: any): void {
    this.searchTerm = event.target.value;
    this.filterCredits();
    this.showDropdown = true;
    
    // Reset selected credit if search term changes
    if (this.selectedCredit && 
        (!this.selectedCredit.utilisateur?.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
         !this.selectedCredit.id.toString().includes(this.searchTerm))) {
      this.selectedCredit = null;
      this.newPayment.id_credit = null;
    }
  }

  selectCredit(credit: Credit): void {
    this.selectedCredit = credit;
    this.searchTerm = `#${credit.id} - ${credit.utilisateur}`;
    this.newPayment.id_credit = credit.id;
    this.showDropdown = false;
  }

  onInputFocus(): void {
    this.filterCredits();
    this.showDropdown = true;
  }

  onInputBlur(): void {
    // Delay hiding dropdown to allow click events on options
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  clearSelection(): void {
    this.searchTerm = '';
    this.selectedCredit = null;
    this.newPayment.id_credit = null;
    this.filteredCredits = this.activeCredits;
  }

  startCountdown(): void {
    this.successModalTimer = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        this.closeSuccessModal();
      }
    }, 1000);
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
    this.countdownSeconds = 3;
    
    // Clear the timer if it exists
    if (this.successModalTimer) {
      clearInterval(this.successModalTimer);
      this.successModalTimer = null;
    }
  }

  getPaymentModeLabel(mode: string): string {
    switch (mode) {
      case 'especes':
        return 'Espèces';
      case 'carte':
        return 'Carte bancaire';
      case 'virement':
        return 'Virement';
      case 'cheque':
        return 'Chèque';
      default:
        return mode;
    }
  }

  isCaissier(): boolean {
    return this.currentUser?.role === 'caissier';
  }

  ngOnDestroy(): void {
    // Clean up timer when component is destroyed
    if (this.successModalTimer) {
      clearInterval(this.successModalTimer);
      this.successModalTimer = null;
    }
  }
}
