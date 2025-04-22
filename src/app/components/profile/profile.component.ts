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
  
  // Password management
  newPassword = '';
  confirmNewPassword = '';

  // Permissions management
  roles: string[] = [];
  selectedRole: string = 'gerant'; // Rôle par défaut
  permissionsByRole: any[] = [];
  parentPermissions: any[] = [];
  permissionsLoading: boolean = false;
  pendingUpdates: number = 0;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadAllRoles();
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: (data) => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.user = Array.isArray(data) ? data[0][0] || data[0] : data;
        }
      },
      error: (err) => {
        console.error('Profile load error:', err);
      }
    });
  }

  loadAllRoles(): void {
    this.authService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles?.length ? roles : ['gerant', 'cogerant', 'caissier', 'pompiste', 'client'];
        if (!this.roles.includes('gerant')) {
          this.roles.unshift('gerant');
        }
        this.loadPermissionsForRole();
      },
      error: (err) => {
        console.error('Roles load error:', err);
        this.roles = ['gerant', 'cogerant', 'caissier', 'pompiste', 'client'];
        this.loadPermissionsForRole();
      }
    });
  }

  loadPermissionsForRole(): void {
    if (!this.selectedRole) return;

    this.permissionsLoading = true;
    this.pendingUpdates = 0;
    
    this.authService.getPermissionsByRole(this.selectedRole).subscribe({
      next: (permissions) => {
        this.permissionsByRole = permissions || [];
        this.parentPermissions = this.permissionsByRole
          .filter(p => !p.parent_element)
          .sort((a, b) => a.element_name.localeCompare(b.element_name));
        
        // Afficher tous les éléments et sous-éléments dans la console
        console.log(`Permissions pour le rôle ${this.selectedRole}:`);
        this.parentPermissions.forEach(parent => {
          console.log(`- ${parent.element_name} (visible: ${parent.is_visible})`);
          const children = this.getChildPermissions(parent.element_name);
          children.forEach(child => {
            console.log(`  ↳ ${child.element_name} (visible: ${child.is_visible})`);
          });
        });

        this.permissionsLoading = false;
      },
      error: (err) => {
        console.error('Permissions load error:', err);
        this.permissionsLoading = false;
      }
    });
  }

  getChildPermissions(parentElement: string): any[] {
    return this.permissionsByRole
      .filter(p => p.parent_element === parentElement)
      .sort((a, b) => a.element_name.localeCompare(b.element_name));
  }

  onPermissionChange(permission: any, isChecked: boolean): void {
    if (permission.is_visible !== (isChecked ? 1 : 0)) {
      permission.is_visible = isChecked ? 1 : 0;
      permission.hasChanged = true;
      this.updatePendingUpdatesCount();
    }
  }

  updatePendingUpdatesCount(): void {
    this.pendingUpdates = this.permissionsByRole.filter(p => p.hasChanged).length;
  }

  savePermissions(): void {
    const updates = this.permissionsByRole
      .filter(p => p.hasChanged)
      .map(p => ({
        role: p.role,
        element_name: p.element_name,
        is_visible: p.is_visible,
        parent_element: p.parent_element || null
      }));

    if (updates.length === 0) {
      this.showError("Aucune modification à enregistrer.");
      return;
    }

    this.authService.updateMultiplePermissions(updates).subscribe({
      next: (response) => {
        this.showSuccess(`${updates.length} permission(s) mise(s) à jour avec succès`);
        this.pendingUpdates = 0;
        this.permissionsByRole.forEach(p => p.hasChanged = false);
        this.loadPermissionsForRole(); // Recharger les données fraîches
      },
      error: (err) => {
        console.error('Permissions update error:', err);
        this.showError(err.error?.error || "Erreur lors de la mise à jour");
      }
    });
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.previewImage = null;

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
    if (!this.user?.id) {
      this.showError("ID utilisateur manquant.");
      return;
    }
    if (!this.selectedFile) {
      this.showError("Aucune image sélectionnée.");
      return;
    }
  
    const formData = new FormData();
    formData.append('photo', this.selectedFile, this.selectedFile.name);

    this.authService.updateProfilePhoto(this.user.id, formData).subscribe({
      next: (response) => {
        this.user.photo = response.photo;
        this.resetFileUpload();
        this.showSuccess("Photo mise à jour avec succès!");
      },
      error: (err) => {
        this.showError("Erreur lors de l'upload de la photo.");
        console.error('Photo upload error:', err);
      }
    });
  }

  updateProfile(): void {
    if (!this.user?.id) {
      this.showError("ID utilisateur manquant.");
      return;
    }

    const userData = {
      username: this.user.username,
      email: this.user.email,
      numeroTelephone: this.user.numero_telephone
    };

    this.authService.updateUserProfile(this.user.id, userData).subscribe({
      next: () => {
        this.showSuccess("Profil mis à jour avec succès!");
      },
      error: (err) => {
        this.showError("Erreur lors de la mise à jour du profil.");
        console.error('Profile update error:', err);
      }
    });
  }

  updatePassword(): void {
    if (this.newPassword !== this.confirmNewPassword) {
      this.showError("Les mots de passe ne correspondent pas.");
      return;
    }
  
    this.authService.updatePassword(this.newPassword).subscribe({
      next: () => {
        this.showSuccess("Mot de passe mis à jour avec succès!");
        setTimeout(() => {
          this.newPassword = '';
          this.confirmNewPassword = '';
        }, 2000);
      },
      error: (err) => {
        console.error('Password update error:', err);
        this.showError(err.error?.error || "Erreur lors de la mise à jour du mot de passe");
      }
    });
  }

  private resetFileUpload(): void {
    this.selectedFile = null;
    this.previewImage = null;
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
    setTimeout(() => this.successMessage = null, 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
    setTimeout(() => this.errorMessage = null, 5000);
  }
}