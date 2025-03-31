import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, NavbarComponent, SidebarComponent, FooterComponent, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = {}; 
  selectedFile: File | null = null;
  previewImage: string | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  
  // Variables pour la mise à jour du mot de passe
  currentPassword: string = '';
  newPassword: string = '';
  confirmNewPassword: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe(
      data => {
        if (Array.isArray(data) && data[0] && data[0][0]) {
          this.user = data[0][0]; 
          console.log(this.user);
        } else {
          this.errorMessage = "Données de l'utilisateur non valides.";
        }
      },
      error => {
        this.errorMessage = "Erreur lors du chargement du profil.";
      }
    );
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];

      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewImage = e.target.result;
        };
        reader.readAsDataURL(this.selectedFile);
      }
    }
  }

  uploadPhoto(): void {
    if (!this.user || !this.user.id) {
      this.errorMessage = "ID utilisateur manquant.";
      return;
    }
    if (!this.selectedFile) {
      this.errorMessage = "Aucune image sélectionnée.";
      return;
    }
  
    const formData = new FormData();
    formData.append('photo', this.selectedFile, this.selectedFile.name);

    this.authService.updateProfilePhoto(this.user.id, formData).subscribe(
      response => {
        this.user.photo = response.photo;
        this.previewImage = null; 
        this.selectedFile = null;
        this.successMessage = "Photo mise à jour avec succès!";
        this.errorMessage = null;
      },
      error => {
        this.errorMessage = "Erreur lors de l'upload de la photo.";
        this.successMessage = null;
      }
    );
  }

  updateProfile(): void {
    if (!this.user || !this.user.id) {
      this.errorMessage = "ID utilisateur manquant.";
      return;
    }

    const userData = {
      username: this.user.username,
      email: this.user.email,
      numeroTelephone: this.user.numero_telephone
    };

    this.authService.updateUserProfile(this.user.id, userData).subscribe(
      response => {
        this.successMessage = "Profil mis à jour avec succès!";
        this.errorMessage = null;
      },
      error => {
        this.errorMessage = "Erreur lors de la mise à jour du profil.";
        this.successMessage = null;
      }
    );
  }
  updatePassword(): void {
    // Vérification que le nouveau mot de passe correspond à la confirmation
    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas.";
      return;
    }
  
    // Appeler la méthode updatePassword du service
    this.authService.updatePassword(this.newPassword).subscribe(
      response => {
        // Afficher un message de succès
        this.successMessage = "Mot de passe mis à jour avec succès!";
        this.errorMessage = null;
  
        // Rafraîchir la page après un délai (optionnel, pour laisser le temps à l'utilisateur de voir le message)
        setTimeout(() => {
          location.reload();  // Rafraîchit la page
        }, 2000);  // 2 secondes pour voir le message avant que la page ne se rafraîchisse
      },
      error => {
        this.errorMessage = "Erreur lors de la mise à jour du mot de passe.";
        this.successMessage = null;
      }
    );
  }
}
