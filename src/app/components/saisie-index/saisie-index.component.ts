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

    // Écouter les changements sur index_fermeture pour recalculer les totaux
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
            this.loadAvailablePistolets();
          } else {
            alert('Seuls les pompistes peuvent saisir des index');
          }
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil', err);
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
                alert('Aucune affectation trouvée pour aujourd\'hui');
              } else if (!this.currentAffectation.affectation_id) {
                console.error('L\'affectation trouvée n\'a pas d\'ID:', this.currentAffectation);
                alert('Erreur: l\'affectation n\'a pas d\'identifiant valide');
              }
              
              this.loadingAffectation = false;
            },
            error: (err) => {
              console.error('Erreur lors de la récupération des affectations', err);
              this.loadingAffectation = false;
            }
          });
        } else {
          alert('Aucun calendrier trouvé pour aujourd\'hui');
          this.loadingAffectation = false;
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du calendrier', err);
        this.loadingAffectation = false;
      }
    });
  }

  loadAvailablePistolets(): void {
    this.loadingPistolets = true;
    this.pompeService.getAllPistolets().subscribe({
      next: (pistolets) => {
        this.pistolets = pistolets.filter((p: any) => 
          p.statut === 'disponible' && 
          (!this.currentAffectation || p.pompe_id === this.currentAffectation.pompe_id)
        );
        this.loadingPistolets = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pistolets', err);
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
      next: (releves) => {
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
      error: (err) => {
        console.error('Erreur lors de la récupération des historiques', err);
        this.lastClosingIndex = 0;
        this.indexForm.get('index_ouverture')?.setValue(0);
        this.updateCalculs();
      }
    });
  }

  onSubmit(): void {
    if (this.indexForm.invalid || !this.currentAffectation?.affectation_id) {
      alert('Veuillez remplir tous les champs correctement et vérifier votre affectation');
      return;
    }

    const formValue = this.indexForm.getRawValue();
    
    // Convertir les valeurs en nombres
    formValue.index_ouverture = Number(formValue.index_ouverture);
    formValue.index_fermeture = Number(formValue.index_fermeture);

    if (formValue.index_fermeture < formValue.index_ouverture) {
      alert('L\'index de fermeture doit être supérieur ou égal à l\'index d\'ouverture');
      return;
    }

    const dataToSend = {
      affectation_id: this.currentAffectation.affectation_id, // Utilisation de affectation_id au lieu de id
      pistolet_id: formValue.pistolet_id,
      index_ouverture: formValue.index_ouverture,
      index_fermeture: formValue.index_fermeture,
      date: formValue.date
    };

    console.log('Données envoyées au backend:', dataToSend);

    this.pompeService.enregistrerReleve(dataToSend).subscribe({
      next: () => {
        alert('Relevé enregistré avec succès');
        this.indexForm.reset({
          date: this.today,
          index_ouverture: '',
          index_fermeture: ''
        });
        this.lastClosingIndex = null;
      },
      error: (err) => {
        console.error('Erreur lors de l\'enregistrement', err);
        console.error('Détails de l\'erreur:', err.error);
        alert(`Erreur lors de l'enregistrement du relevé: ${err.error?.message || 'Erreur inconnue'}`);
      }
    });
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
}
//K