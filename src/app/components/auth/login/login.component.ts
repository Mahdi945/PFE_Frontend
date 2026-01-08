import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// Composant de connexion pour l'authentification des utilisateurs
@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  isPasswordVisible = false;
  isLoading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  // Initialisation du composant
  ngOnInit(): void {
    this.checkAuthenticationStatus();
  }

  // Nettoyage des ressources lors de la destruction
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Création du formulaire avec les validations
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // Vérification si l'utilisateur est déjà connecté
  private checkAuthenticationStatus(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.redirectBasedOnRole(user.role);
      }
    });
  }

  // Basculer la visibilité du mot de passe
  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  // Affichage d'un message d'erreur
  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      const errorElement = document.querySelector('.error-message');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = '';
      }
    }, 8000);
  }

  // Effacement du message d'erreur
  clearError(): void {
    this.errorMessage = '';
  }
  // Getters pour l'accès aux contrôles du formulaire
  get usernameOrEmailControl() {
    return this.loginForm.get('usernameOrEmail');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  get isUsernameOrEmailInvalid(): boolean {
    const control = this.usernameOrEmailControl;
    return !!(control?.invalid && control?.touched);
  }

  get isPasswordInvalid(): boolean {
    const control = this.passwordControl;
    return !!(control?.invalid && control?.touched);
  }

  // Soumission du formulaire de connexion
  onLogin(): void {
    this.clearError();

    if (this.loginForm.invalid) {
      this.markFormGroupTouched();

      const usernameErrors = this.usernameOrEmailControl?.errors;
      const passwordErrors = this.passwordControl?.errors;

      if (usernameErrors && passwordErrors) {
        this.showError('Veuillez remplir correctement tous les champs requis.');
      } else if (usernameErrors) {
        if (usernameErrors['required']) {
          this.showError("Le nom d'utilisateur ou l'email est requis.");
        } else if (usernameErrors['minlength']) {
          this.showError(
            "Le nom d'utilisateur doit contenir au moins 3 caractères."
          );
        }
      } else if (passwordErrors) {
        if (passwordErrors['required']) {
          this.showError('Le mot de passe est requis.');
        } else if (passwordErrors['minlength']) {
          this.showError('Le mot de passe doit contenir au moins 6 caractères.');
        }
      }

      return;
    }

    this.isLoading = true;
    const credentials = this.loginForm.value;
    const loginData = this.prepareLoginData(credentials);

    this.authService
      .login(loginData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: response => this.handleLoginSuccess(response),
        error: error => this.handleLoginError(error),
      });
  }

  // Marque tous les champs comme touchés pour la validation
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  // Prépare les données selon le type de connexion (email ou username)
  private prepareLoginData(credentials: any): any {
    const isEmail = credentials.usernameOrEmail.includes('@');
    return isEmail
      ? { email: credentials.usernameOrEmail, password: credentials.password }
      : { username: credentials.usernameOrEmail, password: credentials.password };
  }

  // Gestion du succès de connexion
  private handleLoginSuccess(response: any): void {
    console.log('Connexion réussie', response);

    const user = response.user;
    if (user?.role) {
      this.redirectBasedOnRole(user.role);
    } else {
      this.showError('Erreur: rôle non trouvé dans la réponse du serveur.');
    }
  }
  // Gestion des erreurs de connexion
  private handleLoginError(error: any): void {
    console.error('Erreur de connexion complète:', error);

    let errorMessage: string;

    // Priorité 1: Message spécifique du serveur
    if (error.error?.message) {
      errorMessage = error.error.message;
    }
    // Priorité 2: Erreur sous forme de string
    else if (error.error && typeof error.error === 'string') {
      errorMessage = error.error;
    }
    // Priorité 3: Messages par défaut selon le code d'état
    else {
      const errorMessages: { [key: number]: string } = {
        400: "Nom d'utilisateur ou email et mot de passe requis.",
        401: 'Identifiants de connexion incorrects.',
        403: "Votre compte est désactivé. Contactez l'administration.",
        404: 'Service de connexion non disponible.',
        422: 'Données de connexion invalides.',
        429: 'Trop de tentatives de connexion. Veuillez patienter avant de réessayer.',
        500: 'Erreur serveur interne. Veuillez réessayer plus tard.',
        502: 'Service temporairement indisponible.',
        503: 'Service en maintenance.',
      };

      errorMessage =
        errorMessages[error.status] ||
        'Une erreur de connexion est survenue. Veuillez vérifier vos informations et réessayer.';
    }

    this.showError(errorMessage);
  }

  // Redirection selon le rôle de l'utilisateur
  private redirectBasedOnRole(role: string): void {
    const routes: { [key: string]: string } = {
      gerant: '/dashboard-gerant',
      Cogerant: '/dashboard-cogerant',
      pompiste: '/dashboard-pompiste',
      caissier: '/dashboard-caissier',
      client: '/dashboard-client',
    };

    const route = routes[role];
    if (route) {
      this.router.navigate([route]);
    } else {
      this.showError('Rôle inconnu, impossible de rediriger.');
    }
  }
}
