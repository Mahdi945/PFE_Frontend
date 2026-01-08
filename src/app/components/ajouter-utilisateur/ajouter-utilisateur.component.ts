import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ajouter-utilisateur',
  standalone: true,
  imports: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './ajouter-utilisateur.component.html',
  styleUrls: ['./ajouter-utilisateur.component.css'],
})
export class AjouterUtilisateurComponent {
  user: any = {
    username: '',
    email: '',
    numero_telephone: '',
    password: '',
    role: '',
  };
  showConfirmationBox: boolean = false;
  showSuccessBox: boolean = false;
  errorMessage: string = ''; // Pour afficher le message d'erreur

  // Nouvelles propriétés pour les modales modernes
  showMessageModal: boolean = false;
  showConfirmationModal: boolean = false;
  isSuccessMessage: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';

  constructor(
    private userService: UserService,
    private router: Router
  ) {}
  // Validation de l'email
  isEmailValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.user.email) && this.user.email.length <= 255;
  }
  // Validation du mot de passe
  isPasswordValid(): boolean {
    const password = this.user.password;

    // Vérification de la longueur
    if (password.length < 8 || password.length > 20) {
      return false;
    }

    // Vérification des critères de sécurité
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }

  // Validation détaillée du mot de passe pour les messages d'erreur
  getPasswordErrors(): string[] {
    const password = this.user.password;
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Au moins 8 caractères');
    }
    if (password.length > 20) {
      errors.push('Maximum 20 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Au moins 1 majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Au moins 1 minuscule');
    }
    if (!/\d/.test(password)) {
      errors.push('Au moins 1 chiffre');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Au moins 1 caractère spécial (!@#$%^&*...)');
    }

    return errors;
  }

  // Méthodes pour vérification en temps réel des critères de mot de passe
  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.user.password || '');
  }

  hasLowerCase(): boolean {
    return /[a-z]/.test(this.user.password || '');
  }

  hasNumber(): boolean {
    return /\d/.test(this.user.password || '');
  }

  hasSpecialChar(): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.user.password || '');
  }

  isMinLength(): boolean {
    return (this.user.password || '').length >= 8;
  }

  isMaxLength(): boolean {
    return (this.user.password || '').length <= 20;
  }

  // Validation du nom d'utilisateur
  isUsernameValid(): boolean {
    return this.user.username.trim().length >= 3 && this.user.username.length <= 50;
  }

  // Validation du numéro de téléphone
  isPhoneNumberValid(): boolean {
    // Regex pour numéro de téléphone mobile international
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return (
      phoneRegex.test(this.user.numero_telephone.replace(/[\s\-\(\)]/g, '')) &&
      this.user.numero_telephone.length <= 14
    );
  }

  // Validation complète du formulaire
  validateForm(): string[] {
    const errors: string[] = [];

    if (!this.user.username.trim()) {
      errors.push("Le nom d'utilisateur est requis");
    } else if (!this.isUsernameValid()) {
      errors.push("Le nom d'utilisateur doit contenir entre 3 et 50 caractères");
    }

    if (!this.user.email.trim()) {
      errors.push("L'email est requis");
    } else if (!this.isEmailValid()) {
      errors.push('Email invalide ou trop long (max 255 caractères)');
    }
    if (!this.user.password) {
      errors.push('Le mot de passe est requis');
    } else if (!this.isPasswordValid()) {
      const passwordErrors = this.getPasswordErrors();
      errors.push('Mot de passe invalide. Requis: ' + passwordErrors.join(', '));
    }

    if (!this.user.numero_telephone.trim()) {
      errors.push('Le numéro de téléphone est requis');
    } else if (!this.isPhoneNumberValid()) {
      errors.push('Numéro de téléphone invalide ou trop long (max 14 caractères)');
    }

    if (!this.user.role) {
      errors.push('Veuillez sélectionner un rôle');
    }

    return errors;
  }

  // Ouvrir la boîte de confirmation
  onSubmit(): void {
    const validationErrors = this.validateForm();

    if (validationErrors.length > 0) {
      this.showErrorModal('Erreurs de validation', validationErrors.join('\n'));
      return;
    }

    this.showConfirmationModalDialog();
  }

  // Afficher modal de confirmation moderne
  showConfirmationModalDialog(): void {
    this.modalTitle = "Confirmer l'ajout";
    this.modalMessage = 'Êtes-vous sûr de vouloir ajouter cet utilisateur ?';
    this.showConfirmationModal = true;
  }

  // Afficher modal de succès moderne
  showSuccessModal(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isSuccessMessage = true;
    this.showMessageModal = true;
  }

  // Afficher modal d'erreur moderne
  showErrorModal(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isSuccessMessage = false;
    this.showMessageModal = true;
  }
  // Fermer la boîte de confirmation
  closeModal(): void {
    this.showConfirmationBox = false;
  }

  // Fermer toutes les modales
  closeModals(): void {
    this.showMessageModal = false;
    this.showConfirmationModal = false;
    this.showConfirmationBox = false;
    this.showSuccessBox = false;
  }

  // Gérer le clic sur l'overlay des modales
  onModalOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModals();
    }
  }

  // Confirmer l'action depuis la modal de confirmation
  confirmAction(): void {
    this.closeModals();
    this.confirmUserAddition();
  }
  // Ajouter l'utilisateur après confirmation
  confirmUserAddition(): void {
    this.showConfirmationBox = false; // Fermer la boîte de confirmation

    this.userService.addUser(this.user).subscribe(
      response => {
        console.log('Utilisateur ajouté avec succès', response);
        this.showSuccessModal('Succès', 'Utilisateur ajouté avec succès !');
        setTimeout(() => {
          this.closeModals();
          this.resetForm();
        }, 3000); // Message de succès disparaît après 3 secondes
      },
      error => {
        console.error("Erreur lors de l'ajout de l'utilisateur", error);
        let errorMsg = '';
        if (error.error?.errors) {
          // Afficher toutes les erreurs de validation
          errorMsg = error.error.errors
            .map((err: { msg: any }) => err.msg)
            .join(', ');
        } else {
          errorMsg =
            error.error?.message ||
            "Une erreur est survenue lors de l'ajout de l'utilisateur.";
        }
        this.showErrorModal('Erreur', errorMsg);
      }
    );
  }

  // Réinitialiser le formulaire
  resetForm(): void {
    this.user = {
      username: '',
      email: '',
      numero_telephone: '',
      password: '',
      role: '',
    };
  }

  // Fermer la boîte de succès
  closeSuccessBox(): void {
    this.showSuccessBox = false;
  }
}
