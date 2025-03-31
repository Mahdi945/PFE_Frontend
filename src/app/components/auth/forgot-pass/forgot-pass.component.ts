import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-pass',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-pass.component.html',
  styleUrls: ['./forgot-pass.component.css']
})
export class ForgotPassComponent {
  email: string = '';
  message: string = '';
  isError: boolean = false; // Variable pour déterminer si le message est une erreur ou un succès
  forgotPasswordForm: FormGroup;

  constructor(private authService: AuthService, private fb: FormBuilder) {
    // Initialisation du formulaire
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Getter pour accéder au champ email du formulaire
  get emailControl() {
    return this.forgotPasswordForm.get('email');
  }

  // Fonction pour envoyer la demande de réinitialisation du mot de passe
  onRequestPasswordReset() {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    const email = this.forgotPasswordForm.value.email;

    // Appel au service AuthService pour la réinitialisation du mot de passe
    this.authService.requestPasswordReset(email).subscribe(
      (response: any) => {
        // Message de succès
        this.message = 'Vérifiez votre email, vous recevrez un lien pour réinitialiser votre mot de passe.';
        this.isError = false;

        // Rafraîchissement de la page après 5 secondes
        setTimeout(() => {
          window.location.reload(); // Recharge la page
        }, 5000); // Délai de 5 secondes
      },
      (error) => {
        // Gestion des erreurs
        if (error.status === 404) {
          this.message = 'Utilisateur non trouvé. Veuillez vérifier votre email.';
        } else {
          this.message = 'Une erreur est survenue. Veuillez réessayer plus tard.';
        }
        this.isError = true;
      }
    );
  }
}
