import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { GestionReclamationsService } from '../../services/gestion-reclamations.service';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-envoyer-reclamation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './envoyer-reclamation.component.html',
  styleUrls: ['./envoyer-reclamation.component.css'],
})
export class EnvoyerReclamationComponent {
  reclamationForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  user: any = {}; // Ajout de la propriété user pour stocker les données du client

  constructor(
    private fb: FormBuilder,
    private reclamationService: GestionReclamationsService,
    private authService: AuthService
  ) {
    this.reclamationForm = this.fb.group({
      objet: ['', [Validators.required, Validators.minLength(5)]],
      raison: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
    });

    // Chargement des données du profil utilisateur au moment de la construction
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: data => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.user = Array.isArray(data) ? data[0][0] || data[0] : data;
        }
      },
      error: err => {
        console.error('Erreur lors du chargement du profil:', err);
        this.showError('Erreur lors du chargement des informations du profil');
      },
    });
  }

  envoyerReclamation() {
    if (this.reclamationForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.user?.id) {
      this.showError('Vous devez être connecté pour envoyer une réclamation');
      this.isLoading = false;
      return;
    }

    const reclamationData = {
      id_client: this.user.id,
      objet: this.reclamationForm.value.objet,
      raison: this.reclamationForm.value.raison,
      description: this.reclamationForm.value.description,
    };

    this.reclamationService.envoyerReclamation(reclamationData).subscribe({
      next: response => {
        this.isLoading = false;
        this.showSuccess(
          'Votre réclamation a été envoyée avec succès. Nous vous contacterons bientôt.'
        );
        this.reclamationForm.reset();
      },
      error: err => {
        this.isLoading = false;
        this.showError(
          err.error?.message ||
            "Une erreur est survenue lors de l'envoi de votre réclamation."
        );
        console.error("Erreur lors de l'envoi de la réclamation:", err);
      },
    });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = null), 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => (this.errorMessage = null), 5000);
  }
}
