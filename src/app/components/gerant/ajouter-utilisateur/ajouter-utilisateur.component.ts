import { Component } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ajouter-utilisateur',
  standalone: true,
  imports: [ 
    NavbarComponent, 
    SidebarComponent, 
    FooterComponent, 
    FormsModule, 
    CommonModule
  ],
  templateUrl: './ajouter-utilisateur.component.html',
  styleUrls: ['./ajouter-utilisateur.component.css']
})
export class AjouterUtilisateurComponent {
  user: any = {
    username: '',
    email: '',
    numero_telephone: '',
    password: '',
    role: ''
  };

  showConfirmationBox: boolean = false;
  showSuccessBox: boolean = false;
  errorMessage: string = ''; // Pour afficher le message d'erreur

  constructor(private userService: UserService, private router: Router) {}

  // Vérification du numéro de téléphone
  isPhoneNumberValid(): boolean {
    return this.user.numero_telephone.length >= 8 && /^\d+$/.test(this.user.numero_telephone);
  }

  // Ouvrir la boîte de confirmation
  onSubmit(): void {
    if (!this.isPhoneNumberValid()) {
      alert("Le numéro de téléphone doit contenir au moins 8 chiffres.");
      return;
    }
    if (!this.user.role) {
      alert("Veuillez sélectionner un rôle.");
      return;
    }
    this.showConfirmationBox = true;
  }

  // Fermer la boîte de confirmation
  closeModal(): void {
    this.showConfirmationBox = false;
  }

  // Ajouter l'utilisateur après confirmation
  confirmUserAddition(): void {
    this.showConfirmationBox = false; // Fermer la boîte de confirmation

    this.userService.addUser(this.user).subscribe(
      (response) => {
        console.log('Utilisateur ajouté avec succès', response);
        this.showSuccessBox = true;
        setTimeout(() => {
          this.closeSuccessBox();
          this.router.navigate(['/ajouter-utilisateur']);
        }, 3000); // Message de succès disparaît après 3 secondes
      },
      (error) => {
        console.error("Erreur lors de l'ajout de l'utilisateur", error);
        if (error.error?.errors) {
          // Afficher toutes les erreurs de validation
          this.errorMessage = error.error.errors.map((err: { msg: any; }) => err.msg).join(", ");
        } else {
          this.errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'ajout de l\'utilisateur.';
        }
        setTimeout(() => {
          this.errorMessage = ''; // Masquer le message d'erreur après 3 secondes
        }, 3000);
      }
    );
  }

  // Fermer la boîte de succès
  closeSuccessBox(): void {
    this.showSuccessBox = false;
  }
}
