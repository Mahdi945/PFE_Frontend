import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forgot-pass',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './forgot-pass.component.html',
  styleUrls: ['./forgot-pass.component.css'],
})
export class ForgotPassComponent {
  message = '';
  isError = false;
  isLoading = false;
  forgotPasswordForm: FormGroup;
  emailSent = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  // Getter pour accéder facilement au contrôle email
  get emailControl() {
    return this.forgotPasswordForm.get('email');
  }

  // Fonction pour envoyer la demande de réinitialisation
  onRequestPasswordReset() {
    if (this.forgotPasswordForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const email = this.forgotPasswordForm.value.email;

    this.authService.requestPasswordReset(email).subscribe({
      next: response => {
        this.handleSuccessResponse();
      },
      error: error => {
        this.handleErrorResponse(error);
      },
    });
  }

  private handleSuccessResponse() {
    this.isLoading = false;
    this.emailSent = true;
    this.message =
      'Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.';
    this.isError = false;

    // Réinitialiser le formulaire après succès
    this.forgotPasswordForm.reset();
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      this.forgotPasswordForm.get(key)?.setErrors(null);
    });
  }

  private handleErrorResponse(error: any) {
    this.isLoading = false;
    this.isError = true;

    switch (error.status) {
      case 404:
        this.message = 'Aucun compte trouvé avec cet email.';
        break;
      case 429:
        this.message = 'Trop de tentatives. Veuillez patienter avant de réessayer.';
        break;
      case 500:
        this.message = 'Erreur serveur. Veuillez réessayer plus tard.';
        break;
      default:
        this.message = 'Une erreur inattendue est survenue.';
        break;
    }
  }

  // Réinitialiser le message d'état
  clearMessage() {
    this.message = '';
  }
}
