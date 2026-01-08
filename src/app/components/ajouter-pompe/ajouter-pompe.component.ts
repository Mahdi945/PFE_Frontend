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
    CommonModule,
  ],
  templateUrl: './ajouter-pompe.component.html',
  styleUrls: ['./ajouter-pompe.component.css'],
})
export class AjouterPompeComponent {
  pompe: any = {
    numero_pompe: '',
    type_pompe: 'multi-produits', // Par défaut multi-produits
    statut: 'reserve',
  };

  nombrePistolets: number = 1;
  pistolets: any[] = [];
  showPistoletsForm: boolean = false;
  showConfirmationModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  errorMessage: string = '';
  countdown: number = 5;
  isSubmitting: boolean = false;

  // Prix unitaires par défaut selon les connaissances des prix carburants en Tunisie
  prixParDefaut: { [key: string]: number } = {
    SP95: 2.15, // Sans Plomb 95 - Prix moyen en Tunisie
    SP98: 2.25, // Sans Plomb 98 - Prix moyen en Tunisie
    GAZOLE: 1.85, // Gazole - Prix moyen en Tunisie
    GPL: 0.58, // GPL - Prix moyen en Tunisie
  };

  produitsDisponibles = [
    { code: 'SP95', nom: 'Sans Plomb 95' },
    { code: 'SP98', nom: 'Sans Plomb 98' },
    { code: 'GAZOLE', nom: 'Gazole' },
    { code: 'GPL', nom: 'GPL' },
  ];
  constructor(
    private pompePistoletService: PompePistoletService,
    private router: Router
  ) {}
  // Méthode appelée quand un produit est sélectionné pour un pistolet
  onProduitChange(pistolet: any, produitCode: string): void {
    if (produitCode && this.prixParDefaut[produitCode]) {
      pistolet.prix_unitaire = this.prixParDefaut[produitCode];
    }

    // Générer automatiquement le numéro de pistolet
    if (produitCode && this.pompe.numero_pompe) {
      pistolet.numero_pistolet = this.genererNumeroPistolet(produitCode);
    }
  }

  // Méthode pour générer le numéro de pistolet basé sur le numéro de pompe et le type de produit
  genererNumeroPistolet(typeProduit: string): string {
    const numeroPompe = this.pompe.numero_pompe;
    const typePistolet = typeProduit; // SP95, SP98, GAZOLE, GPL

    // Compter combien de pistolets du même type existent déjà
    const pistoletsMemeProduit = this.pistolets.filter(
      p => p.nom_produit === typeProduit
    );
    const numeroSequence = (pistoletsMemeProduit.length + 1)
      .toString()
      .padStart(2, '0');

    return `${numeroPompe}_PS${typePistolet}${numeroSequence}`;
  }
  genererFormulairePistolets(): void {
    if (this.nombrePistolets < 1 || this.nombrePistolets > 10) {
      this.errorMessage = 'Le nombre de pistolets doit être entre 1 et 10';
      return;
    }

    if (!this.pompe.numero_pompe || this.pompe.numero_pompe.trim() === '') {
      this.errorMessage =
        "Veuillez d'abord saisir le numéro de la pompe avant de configurer les pistolets";
      return;
    }

    this.pistolets = [];
    for (let i = 0; i < this.nombrePistolets; i++) {
      // Générer un numéro de pistolet par défaut
      const numeroParDefaut = `${this.pompe.numero_pompe}_PS${(i + 1).toString().padStart(2, '0')}`;

      this.pistolets.push({
        numero_pistolet: numeroParDefaut,
        nom_produit: '',
        prix_unitaire: 0,
      });
    }
    this.showPistoletsForm = true;
    this.errorMessage = '';
  }
  tousPistoletsValides(): boolean {
    if (!this.showPistoletsForm) return false;

    return this.pistolets.every(
      p =>
        p.numero_pistolet &&
        p.numero_pistolet.trim() !== '' &&
        p.nom_produit &&
        p.nom_produit.trim() !== '' &&
        p.prix_unitaire > 0
    );
  }
  onSubmit(): void {
    this.errorMessage = '';

    // Validation du numéro de pompe
    if (!this.pompe.numero_pompe || this.pompe.numero_pompe.trim() === '') {
      this.showErrorMessage('Veuillez saisir un numéro de pompe valide.');
      return;
    }

    // Validation du type de pompe
    if (!this.pompe.type_pompe) {
      this.showErrorMessage('Veuillez sélectionner un type de pompe.');
      return;
    }

    // Validation du statut
    if (!this.pompe.statut) {
      this.showErrorMessage('Veuillez sélectionner un statut pour la pompe.');
      return;
    }

    // Validation des pistolets - OBLIGATOIRE
    if (!this.showPistoletsForm) {
      this.showErrorMessage(
        'Vous devez configurer au moins un pistolet pour cette pompe.'
      );
      return;
    }

    if (this.pistolets.length === 0) {
      this.showErrorMessage('La pompe doit avoir au moins un pistolet configuré.');
      return;
    }

    if (!this.tousPistoletsValides()) {
      this.showErrorMessage(
        'Veuillez remplir correctement tous les champs des pistolets configurés.'
      );
      return;
    }

    // Toutes les validations sont OK, afficher le modal de confirmation
    this.showConfirmationModal = true;
  }
  async confirmPompeAddition(): Promise<void> {
    this.showConfirmationModal = false;
    this.isSubmitting = true;

    try {
      // D'abord créer la pompe
      const pompeResponse = await this.pompePistoletService
        .addPompe(this.pompe)
        .toPromise(); // Ensuite créer tous les pistolets
      const pistoletPromises = this.pistolets.map(pistolet =>
        this.pompePistoletService
          .addPistolet({
            numero_pompe: this.pompe.numero_pompe,
            numero_pistolet: pistolet.numero_pistolet,
            nom_produit: pistolet.nom_produit,
            prix_unitaire: pistolet.prix_unitaire,
          })
          .toPromise()
      );

      await Promise.all(pistoletPromises);
      this.afficherSucces();
    } catch (error: unknown) {
      this.handleError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
  }
  private handleError(error: unknown): void {
    console.error("Erreur lors de l'ajout:", error);

    if (error instanceof HttpErrorResponse) {
      const errorMessage =
        error.error?.message || "Une erreur est survenue lors de l'enregistrement.";

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

    // Afficher le modal d'erreur au lieu d'un message temporaire
    this.showErrorModal = true;
  }

  afficherSucces(): void {
    this.showSuccessModal = true;
    const timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(timer);
        this.closeSuccessModal();
        this.router.navigate(['/liste-pompes']);
      }
    }, 1000);
  }

  // Nouvelles méthodes pour gérer les modals
  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.countdown = 5;
    this.router.navigate(['/liste-pompes']);
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }

  // Méthode pour réinitialiser le formulaire
  resetForm(): void {
    this.pompe = {
      numero_pompe: '',
      type_pompe: 'multi-produits',
      statut: 'reserve',
    };
    this.nombrePistolets = 1;
    this.pistolets = [];
    this.showPistoletsForm = false;
    this.errorMessage = '';
  }

  // Méthodes dépréciées maintenues pour compatibilité
  closeModal(): void {
    this.closeConfirmationModal();
  }

  closeSuccessBox(): void {
    this.closeSuccessModal();
  }

  // Méthode appelée quand le numéro de pompe change
  onNumeroPompeChange(): void {
    // Si des pistolets sont déjà configurés, mettre à jour leurs numéros
    if (this.showPistoletsForm && this.pistolets.length > 0) {
      this.pistolets.forEach((pistolet, index) => {
        if (pistolet.nom_produit) {
          // Si un produit est sélectionné, générer le numéro basé sur le produit
          pistolet.numero_pistolet = this.genererNumeroPistolet(
            pistolet.nom_produit
          );
        } else {
          // Sinon, générer un numéro par défaut
          pistolet.numero_pistolet = `${this.pompe.numero_pompe}_PS${(index + 1).toString().padStart(2, '0')}`;
        }
      });
    }
  }
}
