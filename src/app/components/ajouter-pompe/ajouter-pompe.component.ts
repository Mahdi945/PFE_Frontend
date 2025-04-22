import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PompePistoletService } from '../../services/pompes-pistolets.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-ajouter-pompe',
  standalone: true,
  imports: [ 
    NavbarComponent, 
    SidebarComponent, 
    FooterComponent, 
    FormsModule, 
    CommonModule
  ],
  templateUrl: './ajouter-pompe.component.html',
  styleUrls: ['./ajouter-pompe.component.css']
})
export class AjouterPompeComponent {
  pompe: any = {
    numero_pompe: '',
    type_pompe: '',
    statut: 'reserve'
  };

  nombrePistolets: number = 1;
  pistolets: any[] = [];
  showPistoletsForm: boolean = false;
  showConfirmationBox: boolean = false;
  showSuccessBox: boolean = false;
  errorMessage: string = '';
  countdown: number = 5;
  isSubmitting: boolean = false;

  produitsDisponibles = [
    { code: 'SP95', nom: 'Sans Plomb 95' },
    { code: 'SP98', nom: 'Sans Plomb 98' },
    { code: 'GAZOLE', nom: 'Gazole' },
    { code: 'GPL', nom: 'GPL' }
  ];

  constructor(
    private pompePistoletService: PompePistoletService, 
    private router: Router
  ) {}

  genererFormulairePistolets(): void {
    if (this.nombrePistolets < 1 || this.nombrePistolets > 10) {
      this.errorMessage = "Le nombre de pistolets doit être entre 1 et 10";
      return;
    }

    this.pistolets = [];
    for (let i = 0; i < this.nombrePistolets; i++) {
      this.pistolets.push({ 
        numero_pistolet: '', 
        nom_produit: '',
        prix_unitaire: 0,
        index_ouverture: 0
      });
    }
    this.showPistoletsForm = true;
    this.errorMessage = '';
  }

  tousPistoletsValides(): boolean {
    if (!this.showPistoletsForm) return false;
    
    return this.pistolets.every(p => 
      p.numero_pistolet && p.numero_pistolet.trim() !== '' &&
      p.nom_produit && p.nom_produit.trim() !== '' &&
      p.prix_unitaire > 0 &&
      (p.index_ouverture !== null && p.index_ouverture !== undefined)
    );
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.pompe.numero_pompe || this.pompe.numero_pompe.trim() === '') {
      this.errorMessage = "Veuillez saisir un numéro de pompe valide.";
      return;
    }

    if (!this.pompe.type_pompe) {
      this.errorMessage = "Veuillez sélectionner un type de pompe.";
      return;
    }

    if (!this.pompe.statut) {
      this.errorMessage = "Veuillez sélectionner un statut pour la pompe.";
      return;
    }

    if (!this.showPistoletsForm || !this.tousPistoletsValides()) {
      this.errorMessage = "Veuillez configurer et remplir correctement tous les pistolets.";
      return;
    }

    this.showConfirmationBox = true;
  }

  async confirmPompeAddition(): Promise<void> {
    this.showConfirmationBox = false;
    this.isSubmitting = true;

    try {
      // D'abord créer la pompe
      const pompeResponse = await this.pompePistoletService.addPompe(this.pompe).toPromise();
      
      // Ensuite créer tous les pistolets avec les nouveaux champs
      const pistoletPromises = this.pistolets.map(pistolet => 
        this.pompePistoletService.addPistolet({
          numero_pompe: this.pompe.numero_pompe,
          numero_pistolet: pistolet.numero_pistolet,
          nom_produit: pistolet.nom_produit,
          prix_unitaire: pistolet.prix_unitaire,
          
        }).toPromise()
      );

      await Promise.all(pistoletPromises);
      this.afficherSucces();
    } catch (error: unknown) {
      this.handleError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private handleError(error: unknown): void {
    console.error('Erreur lors de l\'ajout:', error);
    
    if (error instanceof HttpErrorResponse) {
      const errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'enregistrement.';
      
      if (typeof error.error === 'object' && error.error !== null) {
        if ('message' in error.error && typeof error.error.message === 'string') {
          if (error.error.message.includes('pompe')) {
            this.errorMessage = error.error.message;
          } else if (error.error.message.includes('pistolet')) {
            this.errorMessage = 'Erreur avec les pistolets: ' + error.error.message;
          } else {
            this.errorMessage = errorMessage;
          }
        } else {
          this.errorMessage = errorMessage;
        }
      } else {
        this.errorMessage = errorMessage;
      }
    } else {
      this.errorMessage = 'Une erreur inconnue est survenue';
    }

    // Highlight des champs en erreur
    const input = document.getElementById('numero_pompe') as HTMLInputElement;
    if (input) input.classList.add('is-invalid');
    
    setTimeout(() => {
      this.errorMessage = '';
      if (input) input.classList.remove('is-invalid');
    }, 5000);
  }

  afficherSucces(): void {
    this.showSuccessBox = true;
    const timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(timer);
        this.closeSuccessBox();
        this.router.navigate(['/liste-pompes']);
      }
    }, 1000);
  }

  closeModal(): void {
    this.showConfirmationBox = false;
  }

  closeSuccessBox(): void {
    this.showSuccessBox = false;
    this.countdown = 5;
  }
}