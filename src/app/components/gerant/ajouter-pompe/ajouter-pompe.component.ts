import { Component } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PompePistoletService } from '../../../services/pompes-pistolets.service'; // Import corrigé
import { Router } from '@angular/router';

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
    statut: ''
  };

  showConfirmationBox: boolean = false;
  showSuccessBox: boolean = false;
  errorMessage: string = ''; // Pour afficher le message d'erreur

  constructor(private pompePistoletService: PompePistoletService, private router: Router) {} // Utilisation du service corrigé

  // Ouvrir la boîte de confirmation
  onSubmit(): void {
    if (!this.pompe.type_pompe) {
      alert("Veuillez sélectionner un type de pompe.");
      return;
    }
    if (!this.pompe.statut) {
      alert("Veuillez sélectionner un statut.");
      return;
    }
    this.showConfirmationBox = true;
  }

  // Fermer la boîte de confirmation
  closeModal(): void {
    this.showConfirmationBox = false;
  }


    confirmPompeAddition(): void {
      this.showConfirmationBox = false; // Fermer la boîte de confirmation
    
      this.pompePistoletService.addPompe(this.pompe).subscribe(
        (response) => {
          console.log('Pompe ajoutée avec succès', response);
          this.showSuccessBox = true;
          setTimeout(() => {
            this.closeSuccessBox();
            this.router.navigate(['/ajouter-pompe']);
          }, 3000); // Message de succès disparaît après 3 secondes
        },
        (error) => {
          console.error("Erreur lors de l'ajout de la pompe", error);
    
          // Vérification spécifique pour l'erreur 400 (numéro de pompe déjà utilisé)
          if (error.status === 400 && error.error?.message === 'Numéro de pompe déjà utilisé') {
            this.errorMessage = 'Ce numéro de pompe est déjà utilisé, veuillez en choisir un autre.';
          } else {
            // Autres erreurs générales
            this.errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'ajout de la pompe.';
          }
    
          // Rendre l'input numéro de pompe rouge (en erreur) en cas de duplication
          const numeroPompeInput = document.getElementById('numero_pompe') as HTMLInputElement;
          if (numeroPompeInput) {
            numeroPompeInput.classList.add('is-invalid'); // Ajout de la classe Bootstrap pour marquer l'input en erreur
          }
    
          // Masquer le message d'erreur après 3 secondes
          setTimeout(() => {
            this.errorMessage = '';
            // Retirer la classe d'erreur
            if (numeroPompeInput) {
              numeroPompeInput.classList.remove('is-invalid');
            }
          }, 3000);
        }
      );
    }
      
  // Fermer la boîte de succès
  closeSuccessBox(): void {
    this.showSuccessBox = false;
  }
}
