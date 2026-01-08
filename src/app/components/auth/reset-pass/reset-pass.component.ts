import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-pass',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './reset-pass.component.html',
  styleUrls: ['./reset-pass.component.css'],
})
export class ResetPassComponent implements OnInit {
  message = '';
  isError = false;
  isLoading = false;
  resetPasswordForm: FormGroup;
  passwordVisible = false;
  confirmPasswordVisible = false;
  passwordStrength = '';
  token = '';

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.passwordMatchValidator }
    );

    // Écouter les changements sur le champ password
    this.resetPasswordForm.get('password')?.valueChanges.subscribe(val => {
      this.onPasswordChange(val);
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.message = 'Lien invalide ou expiré.';
      this.isError = true;
    }
  }

  // Getters pour les contrôles du formulaire
  get passwordControl() {
    return this.resetPasswordForm.get('password');
  }

  get confirmPasswordControl() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  // Getters pour les critères de mot de passe
  get passwordHasMinLength() {
    return this.passwordControl?.value?.length >= 8;
  }

  get passwordHasUpperCase() {
    return /[A-Z]/.test(this.passwordControl?.value);
  }

  get passwordHasNumber() {
    return /\d/.test(this.passwordControl?.value);
  }

  get passwordHasSpecialChar() {
    return /[\W_]/.test(this.passwordControl?.value);
  }

  // Validateur de correspondance des mots de passe
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  // Analyse de la force du mot de passe
  onPasswordChange(password: string) {
    if (!password) {
      this.passwordStrength = '';
      return;
    }

    const lengthValid = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[\W_]/.test(password);

    if (lengthValid && hasUpperCase && hasDigit && hasSpecialChar) {
      this.passwordStrength = password.length >= 14 ? 'strong' : 'medium';
    } else {
      this.passwordStrength = 'weak';
    }
  }
  // Soumission du formulaire
  onResetPassword() {
    if (this.resetPasswordForm.invalid || !this.token) {
      this.message = 'Veuillez remplir tous les champs correctement.';
      this.isError = true;
      return;
    }

    this.isLoading = true;
    this.message = '';
    const newPassword = this.resetPasswordForm.value.password;

    this.authService.resetPassword(newPassword, this.token).subscribe({
      next: response => {
        this.message =
          'Mot de passe réinitialisé avec succès ! Redirection en cours...';
        this.isError = false;
        this.isLoading = false;

        // Redirection après 3 secondes
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { message: 'Mot de passe réinitialisé avec succès' },
          });
        }, 3000);
      },
      error: error => {
        this.isLoading = false;
        this.isError = true;

        // Gestion détaillée des erreurs
        switch (error.status) {
          case 400:
            this.message =
              'Le lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.';
            break;
          case 401:
            this.message =
              "Problème d'authentification avec le serveur. Le middleware backend doit être corrigé.";
            break;
          case 404:
            this.message =
              "Utilisateur non trouvé. Le compte associé à ce lien n'existe plus.";
            break;
          case 422:
            this.message =
              'Le mot de passe ne respecte pas les critères de sécurité requis.';
            break;
          case 429:
            this.message =
              'Trop de tentatives. Veuillez attendre avant de réessayer.';
            break;
          case 500:
            this.message =
              'Erreur interne du serveur. Veuillez réessayer plus tard.';
            break;
          case 0:
            this.message =
              'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
            break;
          default:
            this.message =
              error.error?.message ||
              "Une erreur inattendue s'est produite. Veuillez réessayer.";
        }

        // Log pour le développement
        console.error('Erreur lors de la réinitialisation:', error);
      },
    });
  }

  // Basculer la visibilité du mot de passe
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  // Basculer la visibilité de la confirmation
  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }
}
