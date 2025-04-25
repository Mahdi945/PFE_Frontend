import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PompePistoletService } from '../../services/pompes-pistolets.service';
import { AuthService } from '../../services/auth.service';
import { AffectationCalendrierService } from '../../services/affectation-calendrier.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

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
  styleUrls: ['./saisie-index.component.css']
})
export class SaisieIndexComponent implements OnInit {
  indexForm: FormGroup;
  pistolets: any[] = [];
  loadingPistolets: boolean = false;
  today: string = new Date().toISOString().split('T')[0];
  lastClosingIndex: number | null = null;
  currentUser: any = null;
  currentAffectation: any = null;
  loadingAffectation: boolean = false;
  
  // Modales
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
    private affectationService: AffectationCalendrierService
  ) {
    this.indexForm = this.fb.group({
      pistolet_id: ['', Validators.required],
      date: [this.today, Validators.required],
      index_ouverture: [{value: '', disabled: true}, Validators.required],
      index_fermeture: ['', [Validators.required, Validators.min(0)]]
    });

    this.indexForm.get('index_fermeture')?.valueChanges.subscribe(() => {
      this.updateCalculs();
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  updateCalculs(): void {
    // Force la mise à jour des calculs
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
        console.error('Erreur lors du chargement du profil', err);
        this.showError('Erreur lors du chargement du profil');
      }
    });
  }

  loadCurrentAffectation(): void {
    if (!this.currentUser || !this.today) return;
    
    this.loadingAffectation = true;
    this.affectationService.getCalendrierByDate(this.today).subscribe({
      next: (calendrier) => {
        if (calendrier) {
          this.affectationService.getAffectationsByJour(calendrier.id).subscribe({
            next: (affectations) => {
              this.currentAffectation = affectations.find((a: any) => 
                a.pompiste === this.currentUser.username
              );
              
              console.log('Affectation trouvée:', this.currentAffectation);
              
              if (!this.currentAffectation) {
                this.showError('Aucune affectation trouvée pour aujourd\'hui');
              } else if (!this.currentAffectation.pompe_id) {
                console.error('L\'affectation trouvée n\'a pas de pompe_id:', this.currentAffectation);
                this.showError('Erreur: aucune pompe associée à cette affectation');
              } else {
                this.loadPistoletsByPompe(this.currentAffectation.pompe_id);
              }
              
              this.loadingAffectation = false;
            },
            error: (err) => {
              console.error('Erreur lors de la récupération des affectations', err);
              this.showError('Erreur lors de la récupération des affectations');
              this.loadingAffectation = false;
            }
          });
        } else {
          this.showError('Aucun calendrier trouvé pour aujourd\'hui');
          this.loadingAffectation = false;
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du calendrier', err);
        this.showError('Erreur lors de la récupération du calendrier');
        this.loadingAffectation = false;
      }
    });
  }

  loadPistoletsByPompe(pompeId: number): void {
    if (!pompeId) return;
  
    this.loadingPistolets = true;
    this.pompeService.getPistoletsByPompeId(pompeId).subscribe({
      next: (pistolets: any[]) => {
        // Filtrer uniquement les pistolets disponibles
        this.pistolets = pistolets.filter((p: any) => p.statut === 'disponible');
        this.loadingPistolets = false;
        
        if (this.pistolets.length === 0) {
          this.showError('Aucun pistolet disponible pour cette pompe');
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des pistolets', err);
        this.showError('Erreur lors du chargement des pistolets');
        this.loadingPistolets = false;
      }
    });
  }

  onPistoletChange(): void {
    const pistoletId = this.indexForm.get('pistolet_id')?.value;
    if (!pistoletId) return;

    this.pompeService.getHistoriqueReleves(
      pistoletId, 
      new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], 
      this.today
    ).subscribe({
      next: (releves: any[]) => {
        if (releves.length > 0) {
          releves.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime());
          this.lastClosingIndex = releves[0].index_fermeture;
          this.indexForm.get('index_ouverture')?.setValue(this.lastClosingIndex);
        } else {
          this.lastClosingIndex = 0;
          this.indexForm.get('index_ouverture')?.setValue(0);
        }
        this.updateCalculs();
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération des historiques', err);
        this.lastClosingIndex = 0;
        this.indexForm.get('index_ouverture')?.setValue(0);
        this.updateCalculs();
      }
    });
  }


  onSubmit(): void {
    if (this.indexForm.invalid || !this.currentAffectation?.affectation_id) {
      this.showError('Veuillez remplir tous les champs correctement');
      return;
    }

    const formValue = this.indexForm.getRawValue();
    formValue.index_ouverture = Number(formValue.index_ouverture);
    formValue.index_fermeture = Number(formValue.index_fermeture);

    if (formValue.index_fermeture < formValue.index_ouverture) {
      this.showError('L\'index de fermeture doit être supérieur ou égal à l\'index d\'ouverture');
      return;
    }

    this.showConfirmationModal = true;
  }

  confirmSubmit(): void {
    this.showConfirmationModal = false;
    const formValue = this.indexForm.getRawValue();

    const dataToSend = {
      affectation_id: this.currentAffectation.affectation_id,
      pistolet_id: formValue.pistolet_id,
      index_ouverture: Number(formValue.index_ouverture),
      index_fermeture: Number(formValue.index_fermeture),
     
    };

    console.log('Envoi des données au serveur:', dataToSend);

    this.pompeService.enregistrerReleve(dataToSend).subscribe({
      next: (response) => {
        console.log('Réponse du serveur:', response);
        this.showSuccess('Relevé enregistré avec succès');
        this.indexForm.reset({
          date: this.today,
          pistolet_id: '',
          index_ouverture: '',
          index_fermeture: ''
        });
        this.lastClosingIndex = null;
        this.startCountdown();
      },
      error: (err: any) => {
        console.error('Erreur lors de l\'enregistrement', err);
        
        let errorMessage = 'Erreur lors de l\'enregistrement du relevé';
        if (err.error?.code === 'RELEVE_EXISTANT') {
          errorMessage = 'Un relevé existe déjà pour cette affectation aujourd\'hui';
        } else if (err.error?.code === 'INDEX_INCOHERENT') {
          errorMessage = 'Index d\'ouverture ne correspond pas au dernier index enregistré';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        
        this.showError(errorMessage);
      }
    });
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
    return fermeture - ouverture;
  }

  get selectedPistolet(): any {
    const pistoletId = this.indexForm.get('pistolet_id')?.value;
    return this.pistolets.find(p => p.id == pistoletId);
  }

  get montantTotal(): number {
    if (this.selectedPistolet) {
      return this.quantiteVendue * this.selectedPistolet.prix_unitaire;
    }
    return 0;
  }

  get currentShift(): string {
    if (!this.currentAffectation) return '';
    
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'Matin';
    if (hour >= 14 && hour < 22) return 'Après-midi';
    return 'Nuit';
  }
}