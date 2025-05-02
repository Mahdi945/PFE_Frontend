import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PompePistoletService } from '../../services/pompes-pistolets.service';
import { AuthService } from '../../services/auth.service';
import { AffectationCalendrierService } from '../../services/affectation-calendrier.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-saisie-index',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    RouterModule
  ],
  templateUrl: './saisie-index.component.html',
  styleUrls: ['./saisie-index.component.css'],
  providers: [DatePipe]
})
export class SaisieIndexComponent implements OnInit {
  indexForm: FormGroup;
  pistolets: any[] = [];
  loadingPistolets: boolean = false;
  today: Date = new Date();
  displayDate: Date;
  formattedDate: string;
  lastClosingIndex: number | null = null;
  currentUser: any = null;
  currentAffectation: any = null;
  loadingAffectation: boolean = false;
  
  showConfirmationModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  modalMessage: string = '';
  countdown: number = 5;
  countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private pompeService: PompePistoletService,
    private authService: AuthService,
    private affectationService: AffectationCalendrierService,
    private router: Router,
    private datePipe: DatePipe
  ) {
    const currentHour = this.today.getHours();
    this.displayDate = new Date(this.today);
    
    if (currentHour < 6) {
      this.displayDate.setDate(this.displayDate.getDate() - 1);
    }
    
    this.formattedDate = this.datePipe.transform(this.displayDate, 'yyyy-MM-dd') || '';

    this.indexForm = this.fb.group({
      pistolet_id: ['', Validators.required],
      date: [{value: this.formattedDate, disabled: true}, [Validators.required]],
      index_ouverture: [{value: '', disabled: true}, [
        Validators.required, 
        Validators.min(0),
        Validators.pattern(/^\d*\.?\d+$/)
      ]],
      index_fermeture: ['', [
        Validators.required, 
        Validators.min(0),
        Validators.pattern(/^\d*\.?\d+$/)
      ]],
      observations: ['']
    });

    this.indexForm.get('index_fermeture')?.valueChanges.subscribe(() => {
      this.updateCalculs();
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  updateCalculs(): void {
    this.quantiteVendue;
    this.montantTotal;
  }

  loadCurrentUser(): void {
    this.authService.getProfile().subscribe({
      next: (data) => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.currentUser = Array.isArray(data) ? data[0][0] || data[0] : data;
          
          if (this.currentUser.role === 'pompiste') {
            this.loadCurrentAffectation();
          } else {
            this.showError('Seuls les pompistes peuvent saisir des index');
          }
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil utilisateur', err);
        this.showError('Erreur lors du chargement du profil');
      }
    });
  }
// Modifiez la méthode loadCurrentAffectation comme suit :
loadCurrentAffectation(): void {
  if (!this.currentUser) return;
  
  this.loadingAffectation = true;
  
  this.affectationService.getCurrentAffectation(this.currentUser.id).subscribe({
    next: (response: any) => {
      if (response && response.success) {
        this.currentAffectation = response.data;
        console.log('Affectation courante trouvée:', this.currentAffectation);
        
        // Vérification corrigée
        if (this.currentAffectation.pompe_id === undefined || this.currentAffectation.pompe_id === null) {
          console.error('Affectation sans pompe_id:', this.currentAffectation);
          this.showError('Configuration d\'affectation incomplète');
          return;
        }

        this.loadPistoletsByPompe(this.currentAffectation.pompe_id);
      } else {
        console.log('Aucune affectation courante trouvée, tentative avec getAffectationsByDate');
        this.loadAffectationsForDate();
      }
    },
    error: (err) => {
      console.error('Erreur getCurrentAffectation, tentative avec getAffectationsByDate', err);
      this.loadAffectationsForDate();
    },
    complete: () => {
      this.loadingAffectation = false;
    }
  });
}

  loadAffectationsForDate(): void {
    if (!this.currentUser || !this.currentUser.id) {
      this.showError('Utilisateur non identifié');
      this.loadingAffectation = false;
      return;
    }
  
    if (!this.formattedDate) {
      this.showError('Date non valide');
      this.loadingAffectation = false;
      return;
    }
  
    console.log('Recherche des affectations pour:', {
      userId: this.currentUser.id,
      username: this.currentUser.username,
      date: this.formattedDate
    });
  
    this.affectationService.getAffectationsByDate(this.formattedDate).subscribe({
      next: (response: any) => {
        const affectations = Array.isArray(response) ? response : 
                         (response.data ? response.data : []);
  
        if (!affectations || affectations.length === 0) {
          this.showError(`Aucune affectation programmée pour le ${this.formattedDate}`);
          this.loadingAffectation = false;
          return;
        }
  
        this.currentAffectation = affectations.find((a: any) => {
          return (
            (a.pompiste_id && a.pompiste_id === this.currentUser.id) ||
            (a.user_id && a.user_id === this.currentUser.id) ||
            (a.pompiste && a.pompiste === this.currentUser.username) ||
            (a.utilisateur && a.utilisateur.id === this.currentUser.id)
          );
        });
  
        if (!this.currentAffectation) {
          const message = `Aucune affectation trouvée pour ${this.currentUser.username} (ID: ${this.currentUser.id}) le ${this.formattedDate}`;
          console.error(message, { affectations });
          this.showError(message);
          this.loadingAffectation = false;
          return;
        }
  
        console.log('Affectation trouvée:', this.currentAffectation);
  
        if (!this.currentAffectation.pompe_id && !this.currentAffectation.pompe?.id) {
          const errorMsg = 'Configuration d\'affectation incomplète (pas de pompe associée)';
          console.error(errorMsg, this.currentAffectation);
          this.showError(errorMsg);
          this.loadingAffectation = false;
          return;
        }
  
        const pompeId = this.currentAffectation.pompe_id || this.currentAffectation.pompe?.id;
        this.loadPistoletsByPompe(pompeId);
      },
      error: (err) => {
        console.error('Erreur API lors de la récupération des affectations:', err);
        
        let errorMessage = 'Erreur serveur lors de la récupération des affectations';
        if (err.status === 404) {
          errorMessage = `Aucune donnée d'affectation disponible pour le ${this.formattedDate}`;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        
        this.showError(errorMessage);
        this.loadingAffectation = false;
      }
    });
  }

  loadPistoletsByPompe(pompeId: number): void {
    if (!pompeId) return;
  
    this.loadingPistolets = true;
    this.pompeService.getPistoletsByPompeId(pompeId).subscribe({
      next: (pistolets) => {
        this.pistolets = pistolets || [];
        
        if (this.pistolets.length === 0) {
          this.showError('Aucun pistolet disponible pour cette pompe');
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pistolets', err);
        this.showError('Erreur lors du chargement des pistolets');
      },
      complete: () => {
        this.loadingPistolets = false;
      }
    });
  }
// Modifiez la méthode onPistoletChange comme suit :
onPistoletChange(): void {
  const pistoletId = this.indexForm.get('pistolet_id')?.value;
  if (!pistoletId) {
    this.indexForm.get('index_ouverture')?.reset();
    this.lastClosingIndex = null;
    return;
  }

  this.indexForm.get('index_ouverture')?.reset();
  this.lastClosingIndex = null;

  // Utiliser la date du jour pour la recherche
  const dateFrom = new Date(this.displayDate);
  dateFrom.setDate(dateFrom.getDate() - 7); // Chercher sur les 7 derniers jours
  const formattedDateFrom = this.datePipe.transform(dateFrom, 'yyyy-MM-dd');
  const formattedDateTo = this.datePipe.transform(this.displayDate, 'yyyy-MM-dd');

  this.pompeService.getHistoriqueReleves(
    pistoletId,
    formattedDateFrom || '',
    formattedDateTo || ''
  ).subscribe({
    next: (releves: any[]) => {
      // Vérification plus robuste
      if (Array.isArray(releves) && releves.length > 0) {
        // Pas besoin de trier car déjà trié par le backend
        const dernierReleve = releves[0];
        
        // Conversion sécurisée en nombre
        const lastIndex = Number(dernierReleve.index_fermeture) || 0;
        this.lastClosingIndex = lastIndex;
        this.indexForm.get('index_ouverture')?.setValue(this.lastClosingIndex);
      } else {
        // Cas où aucun relevé n'est trouvé
        this.lastClosingIndex = 0;
        this.indexForm.get('index_ouverture')?.setValue(0);
      }
    },
    error: (err) => {
      console.error('Erreur lors de la récupération du dernier relevé', err);
      // Gestion plus élégante de l'erreur
      this.lastClosingIndex = 0;
      this.indexForm.get('index_ouverture')?.setValue(0);
      
      // Ne pas afficher d'erreur si c'est juste qu'aucun relevé n'existe
      if (err.status !== 500 || 
          !err.error?.message?.includes('Erreur lors de la récupération')) {
        this.showError('Erreur lors de la récupération des relevés historiques. L\'index d\'ouverture a été initialisé à 0.');
      }
    }
  });
}

onSubmit(): void {
  // Validation basique du formulaire
  if (this.indexForm.invalid) {
    const errors = [];
    
    if (this.indexForm.get('pistolet_id')?.invalid) {
      errors.push('- Sélectionnez un pistolet');
    }
    
    const ouvertureCtrl = this.indexForm.get('index_ouverture');
    if (ouvertureCtrl?.invalid) {
      if (ouvertureCtrl.errors?.['required']) errors.push('- Index d\'ouverture est requis');
      if (ouvertureCtrl.errors?.['min']) errors.push('- Index d\'ouverture doit être positif');
      if (ouvertureCtrl.errors?.['pattern']) errors.push('- Index d\'ouverture doit être un nombre valide');
    }
    
    const fermetureCtrl = this.indexForm.get('index_fermeture');
    if (fermetureCtrl?.invalid) {
      if (fermetureCtrl.errors?.['required']) errors.push('- Index de fermeture est requis');
      if (fermetureCtrl.errors?.['min']) errors.push('- Index de fermeture doit être positif');
      if (fermetureCtrl.errors?.['pattern']) errors.push('- Index de fermeture doit être un nombre valide');
    }
    
    if (errors.length > 0) {
      this.showError('Veuillez corriger les erreurs suivantes:\n' + errors.join('\n'));
    }
    return;
  }

  // Vérification des index
  const formValue = this.indexForm.getRawValue();
  const indexOuverture = Number(formValue.index_ouverture);
  const indexFermeture = Number(formValue.index_fermeture);

  if (indexFermeture < indexOuverture) {
    this.showError('L\'index de fermeture doit être supérieur ou égal à l\'index d\'ouverture');
    return;
  }



  this.showConfirmationModal = true;
}

confirmSubmit(): void {
  const formValue = this.indexForm.getRawValue();
  const dataToSend = {
    affectation_id: this.currentAffectation.affectation_id,
    date_releve: formValue.date,
    pistolet_id: formValue.pistolet_id,
    index_ouverture: Number(formValue.index_ouverture),
    index_fermeture: Number(formValue.index_fermeture),
    observations: formValue.observations,
    pompiste_id: this.currentUser.id,
    pompe_id: this.currentAffectation.pompe_id
  };

  this.pompeService.enregistrerReleve(dataToSend).subscribe({
    next: () => {
      this.showSuccess('Relevé enregistré avec succès');
      this.resetForm();
      this.startCountdown();
    },
    error: (err) => {
      console.error('Erreur d\'enregistrement:', err);
      // Gestion spécifique des erreurs connues
      if (err.error?.code === 'RELEVE_EXISTANT') {
        this.showError('Un relevé existe déjà pour aujourd\'hui');
      } else {
        this.showError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
      }
    }
  });
}

  private resetForm(): void {
    this.indexForm.reset({
      date: this.formattedDate,
      pistolet_id: '',
      index_ouverture: '',
      index_fermeture: '',
      observations: ''
    });
    this.lastClosingIndex = null;
  }

  private handleSubmissionError(err: any): void {
    let errorMessage = 'Erreur lors de l\'enregistrement du relevé';
    
    if (err.error) {
      if (err.error.code === 'RELEVE_EXISTANT') {
        errorMessage = 'Un relevé existe déjà pour cette affectation aujourd\'hui';
      } else if (err.error.code === 'INDEX_INCOHERENT') {
        errorMessage = 'Index d\'ouverture ne correspond pas au dernier index enregistré';
      } else if (err.error.message) {
        errorMessage = err.error.message;
      }
    }
    
    this.showError(errorMessage);
  }

  startCountdown(): void {
    this.countdown = 5;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.showSuccessModal = false;
      }
    }, 1000);
  }

  showSuccess(message: string): void {
    this.modalMessage = message;
    this.showSuccessModal = true;
  }

  showError(message: string): void {
    this.modalMessage = message;
    this.showErrorModal = true;
  }

  closeModal(): void {
    this.showConfirmationModal = false;
    this.showSuccessModal = false;
    this.showErrorModal = false;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  get quantiteVendue(): number {
    const formValue = this.indexForm.getRawValue();
    const ouverture = Number(formValue.index_ouverture) || 0;
    const fermeture = Number(formValue.index_fermeture) || 0;
    return Math.max(0, fermeture - ouverture);
  }

  get selectedPistolet(): any {
    const pistoletId = this.indexForm.get('pistolet_id')?.value;
    return this.pistolets.find(p => p.id == pistoletId);
  }

  get montantTotal(): number {
    if (this.selectedPistolet && this.selectedPistolet.prix_unitaire) {
      return this.quantiteVendue * this.selectedPistolet.prix_unitaire;
    }
    return 0;
  }

  get currentShift(): string {
    if (!this.currentAffectation) return '';
    return this.currentAffectation.poste || this.currentAffectation.nom_poste || '';
  }
}