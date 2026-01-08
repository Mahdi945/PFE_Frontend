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
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

interface PistoletIndex {
  pistolet: any;
  indexOuverture: number;
  indexFermeture: number | null;
  quantiteVendue: number;
  montantTotal: number;
  lastClosingIndex: number | null;
  isValid: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-saisie-index',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    RouterModule,
  ],
  templateUrl: './saisie-index.component.html',
  styleUrls: ['./saisie-index.component.css'],
  providers: [DatePipe],
})
export class SaisieIndexComponent implements OnInit {
  indexForm: FormGroup;
  pistolets: any[] = [];
  pistoletIndexes: PistoletIndex[] = [];
  loadingPistolets: boolean = false;
  loadingIndexes: boolean = false;
  today: Date = new Date();
  displayDate: Date;
  formattedDate: string;
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

    this.formattedDate =
      this.datePipe.transform(this.displayDate, 'yyyy-MM-dd') || '';
    this.indexForm = this.fb.group({
      date: [{ value: this.formattedDate, disabled: true }, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }
  updateCalculs(): void {
    // Cette méthode est maintenant gérée individuellement pour chaque pistolet
  }

  loadCurrentUser(): void {
    this.authService.getProfile().subscribe({
      next: data => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.currentUser = Array.isArray(data) ? data[0][0] || data[0] : data;

          if (this.currentUser.role === 'pompiste') {
            this.loadCurrentAffectation();
          } else {
            this.showError('Seuls les pompistes peuvent saisir des index');
          }
        }
      },
      error: err => {
        console.error('Erreur lors du chargement du profil utilisateur', err);
        this.showError('Erreur lors du chargement du profil');
      },
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
          if (
            this.currentAffectation.pompe_id === undefined ||
            this.currentAffectation.pompe_id === null
          ) {
            console.error('Affectation sans pompe_id:', this.currentAffectation);
            this.showError("Configuration d'affectation incomplète");
            return;
          }

          this.loadPistoletsByPompe(this.currentAffectation.pompe_id);
        } else {
          console.log(
            'Aucune affectation courante trouvée, tentative avec getAffectationsByDate'
          );
          this.loadAffectationsForDate();
        }
      },
      error: err => {
        console.error(
          'Erreur getCurrentAffectation, tentative avec getAffectationsByDate',
          err
        );
        this.loadAffectationsForDate();
      },
      complete: () => {
        this.loadingAffectation = false;
      },
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
      date: this.formattedDate,
    });

    this.affectationService.getAffectationsByDate(this.formattedDate).subscribe({
      next: (response: any) => {
        const affectations = Array.isArray(response)
          ? response
          : response.data
            ? response.data
            : [];

        if (!affectations || affectations.length === 0) {
          this.showError(
            `Aucune affectation programmée pour le ${this.formattedDate}`
          );
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

        if (
          !this.currentAffectation.pompe_id &&
          !this.currentAffectation.pompe?.id
        ) {
          const errorMsg =
            "Configuration d'affectation incomplète (pas de pompe associée)";
          console.error(errorMsg, this.currentAffectation);
          this.showError(errorMsg);
          this.loadingAffectation = false;
          return;
        }

        const pompeId =
          this.currentAffectation.pompe_id || this.currentAffectation.pompe?.id;
        this.loadPistoletsByPompe(pompeId);
      },
      error: err => {
        console.error('Erreur API lors de la récupération des affectations:', err);

        let errorMessage = 'Erreur serveur lors de la récupération des affectations';
        if (err.status === 404) {
          errorMessage = `Aucune donnée d'affectation disponible pour le ${this.formattedDate}`;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.showError(errorMessage);
        this.loadingAffectation = false;
      },
    });
  }
  loadPistoletsByPompe(pompeId: number): void {
    if (!pompeId) return;

    this.loadingPistolets = true;
    this.pompeService.getPistoletsByPompeId(pompeId).subscribe({
      next: pistolets => {
        this.pistolets = pistolets || [];

        if (this.pistolets.length === 0) {
          this.showError('Aucun pistolet disponible pour cette pompe');
        } else {
          this.initializePistoletIndexes();
        }
      },
      error: err => {
        console.error('Erreur lors du chargement des pistolets', err);
        this.showError('Erreur lors du chargement des pistolets');
      },
      complete: () => {
        this.loadingPistolets = false;
      },
    });
  }
  initializePistoletIndexes(): void {
    this.pistoletIndexes = this.pistolets.map(pistolet => ({
      pistolet,
      indexOuverture: 0,
      indexFermeture: null,
      quantiteVendue: 0,
      montantTotal: 0,
      lastClosingIndex: null,
      isValid: false,
      errorMessage: '',
    }));

    // Charger les derniers index pour chaque pistolet
    this.loadLastIndexesForAllPistolets();
  }
  loadLastIndexesForAllPistolets(): void {
    this.loadingIndexes = true;

    // Calculer la date de recherche pour récupérer les derniers relevés
    const searchEndDate = new Date(this.displayDate);
    searchEndDate.setDate(searchEndDate.getDate() - 1); // Jour précédent
    const searchStartDate = new Date(searchEndDate);
    searchStartDate.setDate(searchStartDate.getDate() - 30); // 30 jours avant

    const formattedStartDate = this.datePipe.transform(
      searchStartDate,
      'yyyy-MM-dd'
    );
    const formattedEndDate = this.datePipe.transform(searchEndDate, 'yyyy-MM-dd');

    let completedRequests = 0;
    const totalRequests = this.pistoletIndexes.length;

    this.pistoletIndexes.forEach((pistoletIndex, index) => {
      this.pompeService
        .getHistoriqueReleves(
          pistoletIndex.pistolet.id,
          formattedStartDate || '',
          formattedEndDate || ''
        )
        .subscribe({
          next: (releves: any[]) => {
            completedRequests++;

            if (Array.isArray(releves) && releves.length > 0) {
              // Trier les relevés par date décroissante pour obtenir le plus récent
              const sortedReleves = releves.sort((a, b) => {
                const dateA = new Date(a.date_heure || a.date);
                const dateB = new Date(b.date_heure || b.date);
                return dateB.getTime() - dateA.getTime();
              });

              const lastIndex = Number(sortedReleves[0].index_fermeture) || 0;
              this.pistoletIndexes[index].lastClosingIndex = lastIndex;
              this.pistoletIndexes[index].indexOuverture = lastIndex;

              console.log(
                `Pistolet ${pistoletIndex.pistolet.numero_pistolet}: Dernier index trouvé = ${lastIndex}`
              );
            } else {
              // Si aucun relevé précédent, commencer à 0
              this.pistoletIndexes[index].lastClosingIndex = 0;
              this.pistoletIndexes[index].indexOuverture = 0;

              console.log(
                `Pistolet ${pistoletIndex.pistolet.numero_pistolet}: Aucun historique, index d'ouverture = 0`
              );
            }

            // Vérifier si toutes les requêtes sont terminées
            if (completedRequests === totalRequests) {
              this.loadingIndexes = false;
              console.log("Tous les index d'ouverture ont été chargés");
            }
          },
          error: err => {
            completedRequests++;
            console.error(
              `Erreur récupération index pour pistolet ${pistoletIndex.pistolet.numero_pistolet}:`,
              err
            );

            // En cas d'erreur, utiliser 0 comme valeur par défaut
            this.pistoletIndexes[index].lastClosingIndex = 0;
            this.pistoletIndexes[index].indexOuverture = 0;

            // Vérifier si toutes les requêtes sont terminées
            if (completedRequests === totalRequests) {
              this.loadingIndexes = false;
              console.log(
                "Tous les index d'ouverture ont été chargés (avec erreurs)"
              );
            }
          },
        });
    });
  }

  // Méthode alternative pour récupérer le dernier index
  getAlternativeLastIndex(pistoletIndex: PistoletIndex, index: number): void {
    // Utiliser la méthode d'historique pour récupérer les derniers relevés
    const dateFrom = new Date(this.displayDate);
    dateFrom.setDate(dateFrom.getDate() - 30); // Chercher sur les 30 derniers jours
    const formattedDateFrom = this.datePipe.transform(dateFrom, 'yyyy-MM-dd');
    const formattedDateTo = this.datePipe.transform(this.displayDate, 'yyyy-MM-dd');

    this.pompeService
      .getHistoriqueReleves(
        pistoletIndex.pistolet.id,
        formattedDateFrom || '',
        formattedDateTo || ''
      )
      .subscribe({
        next: (releves: any[]) => {
          if (Array.isArray(releves) && releves.length > 0) {
            // Trier les relevés par date décroissante et prendre le plus récent
            const sortedReleves = releves.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const lastIndex = Number(sortedReleves[0].index_fermeture) || 0;

            this.pistoletIndexes[index].lastClosingIndex = lastIndex;
            this.pistoletIndexes[index].indexOuverture = lastIndex;

            console.log(
              `Pistolet ${pistoletIndex.pistolet.numero_pistolet}: Index récupéré via historique = ${lastIndex}`
            );
          } else {
            this.pistoletIndexes[index].lastClosingIndex = 0;
            this.pistoletIndexes[index].indexOuverture = 0;

            console.log(
              `Pistolet ${pistoletIndex.pistolet.numero_pistolet}: Aucun historique trouvé, index = 0`
            );
          }
        },
        error: err => {
          console.error(
            `Erreur alternative pour pistolet ${pistoletIndex.pistolet.numero_pistolet}:`,
            err
          );
          this.pistoletIndexes[index].lastClosingIndex = 0;
          this.pistoletIndexes[index].indexOuverture = 0;
        },
      });
  }
  onIndexFermetureChange(pistoletIndex: PistoletIndex): void {
    if (pistoletIndex.indexFermeture !== null) {
      if (pistoletIndex.indexFermeture < pistoletIndex.indexOuverture) {
        pistoletIndex.isValid = false;
        pistoletIndex.errorMessage =
          "L'index de fermeture doit être supérieur ou égal à l'index d'ouverture";
        pistoletIndex.quantiteVendue = 0;
        pistoletIndex.montantTotal = 0;
      } else {
        pistoletIndex.isValid = true;
        pistoletIndex.errorMessage = '';
        pistoletIndex.quantiteVendue =
          pistoletIndex.indexFermeture - pistoletIndex.indexOuverture;
        pistoletIndex.montantTotal =
          pistoletIndex.quantiteVendue * pistoletIndex.pistolet.prix_unitaire;
      }
    } else {
      pistoletIndex.isValid = false;
      pistoletIndex.quantiteVendue = 0;
      pistoletIndex.montantTotal = 0;
    }
  }
  onSubmit(): void {
    // Validation que tous les index requis sont saisis
    const validPistolets = this.pistoletIndexes.filter(
      p => p.isValid && p.indexFermeture !== null
    );

    if (validPistolets.length === 0) {
      this.showError('Veuillez saisir au moins un index de fermeture valide');
      return;
    }

    // Vérifier qu'il n'y a pas d'erreurs
    const invalidPistolets = this.pistoletIndexes.filter(
      p => p.indexFermeture !== null && !p.isValid
    );
    if (invalidPistolets.length > 0) {
      this.showError('Veuillez corriger les erreurs dans les index de fermeture');
      return;
    }

    this.showConfirmationModal = true;
  }
  confirmSubmit(): void {
    const formValue = this.indexForm.getRawValue();
    const validPistolets = this.pistoletIndexes.filter(
      p => p.isValid && p.indexFermeture !== null
    );

    // Préparer les données pour chaque pistolet
    const requests = validPistolets.map(pistoletIndex => {
      const dataToSend = {
        affectation_id: this.currentAffectation.affectation_id,
        date_releve: formValue.date,
        pistolet_id: pistoletIndex.pistolet.id,
        index_ouverture: pistoletIndex.indexOuverture,
        index_fermeture: pistoletIndex.indexFermeture!,
        pompiste_id: this.currentUser.id,
        pompe_id: this.currentAffectation.pompe_id,
      };

      return this.pompeService.enregistrerReleve(dataToSend);
    }); // Enregistrer tous les relevés
    Promise.allSettled(requests.map(req => req.toPromise()))
      .then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed === 0) {
          this.showSuccess(
            `Tous les relevés (${successful}) ont été enregistrés avec succès`
          );
          this.resetForm();
          this.startCountdown();
        } else if (successful > 0) {
          this.showError(
            `${successful} relevés enregistrés, ${failed} ont échoué. Veuillez vérifier et ressayer.`
          );
        } else {
          this.showError("Erreur lors de l'enregistrement de tous les relevés");
        }
      })
      .catch(err => {
        console.error('Erreur générale:', err);
        this.showError("Erreur lors de l'enregistrement des relevés");
      });
  }
  resetForm(): void {
    this.indexForm.reset({
      date: this.formattedDate,
    });
    // Réinitialiser les index des pistolets
    this.pistoletIndexes.forEach(pistoletIndex => {
      pistoletIndex.indexFermeture = null;
      pistoletIndex.quantiteVendue = 0;
      pistoletIndex.montantTotal = 0;
      pistoletIndex.isValid = false;
      pistoletIndex.errorMessage = '';
    });
  }

  private handleSubmissionError(err: any): void {
    let errorMessage = "Erreur lors de l'enregistrement du relevé";

    if (err.error) {
      if (err.error.code === 'RELEVE_EXISTANT') {
        errorMessage = "Un relevé existe déjà pour cette affectation aujourd'hui";
      } else if (err.error.code === 'INDEX_INCOHERENT') {
        errorMessage =
          "Index d'ouverture ne correspond pas au dernier index enregistré";
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
  get totalQuantiteVendue(): number {
    return this.pistoletIndexes
      .filter(p => p.isValid && p.indexFermeture !== null)
      .reduce((total, p) => total + p.quantiteVendue, 0);
  }

  get totalMontant(): number {
    return this.pistoletIndexes
      .filter(p => p.isValid && p.indexFermeture !== null)
      .reduce((total, p) => total + p.montantTotal, 0);
  }

  get hasValidIndexes(): boolean {
    return this.pistoletIndexes.some(p => p.isValid && p.indexFermeture !== null);
  }

  get validPistoletCount(): number {
    return this.pistoletIndexes.filter(p => p.isValid).length;
  }
  get validPistolets(): PistoletIndex[] {
    return this.pistoletIndexes.filter(p => p.isValid);
  }

  get currentShift(): string {
    if (!this.currentAffectation) return '';
    return this.currentAffectation.poste || this.currentAffectation.nom_poste || '';
  }

  // Track by function for better performance in *ngFor
  trackByPistoletId(index: number, item: PistoletIndex): any {
    return item.pistolet?.id || index;
  }
}
