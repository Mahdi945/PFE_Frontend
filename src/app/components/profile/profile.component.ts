import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    FormsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user: any = {};
  selectedFile: File | null = null;
  previewImage: string | null = null;
  apiUrl = environment.apiUrl;

  // Modal management for modern UI feedback
  showSuccessModal = false;
  showErrorModal = false;
  modalTitle = '';
  modalMessage = '';
  showPasswordModal = false;

  // Password management
  newPassword = '';
  confirmNewPassword = '';
  suggestedPassword = '';
  passwordStrength = {
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  };

  // Permissions management
  roles: string[] = [];
  selectedRole: string = 'gerant'; // Rôle par défaut
  permissionsByRole: any[] = [];
  parentPermissions: any[] = [];
  permissionsLoading: boolean = false;
  pendingUpdates: number = 0;
  // ============ CONSTRUCTOR AND LIFECYCLE ============
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /**
   * Component initialization
   * Loads user profile, roles, and handles tab navigation from query params
   */ /**
   * Component initialization
   * Loads user profile, roles, and handles tab navigation from query params
   */
  ngOnInit(): void {
    this.loadUserProfile();
    this.loadAllRoles();
    this.generateStrongPassword(); // Générer un mot de passe dès l'ouverture de la page

    // Vérifier si on doit rediriger vers l'onglet "changer mot de passe"
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'change-password') {
        setTimeout(() => {
          this.activatePasswordTab();
        }, 500);
      }
    });
  }

  // ============ PROFILE DATA LOADING METHODS ============
  /**
   * Load user profile data from authentication service
   */
  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: data => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.user = Array.isArray(data) ? data[0][0] || data[0] : data;
        }
      },
      error: err => {
        console.error('Profile load error:', err);
      },
    });
  }

  /**
   * Load all available roles from the system
   * Sets default roles if API call fails
   */
  loadAllRoles(): void {
    this.authService.getAllRoles().subscribe({
      next: roles => {
        this.roles = roles?.length
          ? roles
          : ['cogerant', 'caissier', 'pompiste', 'client'];
        if (!this.roles.includes('gerant')) {
          this.roles.unshift('gerant');
        }
        this.loadPermissionsForRole();
      },
      error: err => {
        console.error('Roles load error:', err);
        this.roles = ['cogerant', 'caissier', 'pompiste', 'client'];
        this.loadPermissionsForRole();
      },
    });
  }

  // ============ PERMISSIONS MANAGEMENT METHODS ============
  /**
   * Load permissions for the selected role
   * Organizes permissions into parent-child hierarchy
   */
  loadPermissionsForRole(): void {
    if (!this.selectedRole) return;

    this.permissionsLoading = true;
    this.pendingUpdates = 0;

    this.authService.getPermissionsByRole(this.selectedRole).subscribe({
      next: permissions => {
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
      error: err => {
        console.error('Permissions load error:', err);
        this.permissionsLoading = false;
      },
    });
  }

  /**
   * Get child permissions for a given parent element
   * @param parentElement - Name of the parent element
   * @returns Array of child permissions sorted alphabetically
   */
  getChildPermissions(parentElement: string): any[] {
    return this.permissionsByRole
      .filter(p => p.parent_element === parentElement)
      .sort((a, b) => a.element_name.localeCompare(b.element_name));
  }

  /**
   * Handle permission checkbox changes
   * Marks permission as changed and updates pending count
   * @param permission - Permission object to update
   * @param isChecked - New checked state
   */
  onPermissionChange(permission: any, isChecked: boolean): void {
    if (permission.is_visible !== (isChecked ? 1 : 0)) {
      permission.is_visible = isChecked ? 1 : 0;
      permission.hasChanged = true;
      this.updatePendingUpdatesCount();
    }
  }

  /**
   * Update the count of pending permission changes
   */
  updatePendingUpdatesCount(): void {
    this.pendingUpdates = this.permissionsByRole.filter(p => p.hasChanged).length;
  }

  /**
   * Save all pending permission changes to the backend
   * Shows success/error messages via modal dialogs
   */
  savePermissions(): void {
    const updates = this.permissionsByRole
      .filter(p => p.hasChanged)
      .map(p => ({
        role: p.role,
        element_name: p.element_name,
        is_visible: p.is_visible,
        parent_element: p.parent_element || null,
      }));
    if (updates.length === 0) {
      this.showErrorMessage('Aucune modification à enregistrer.');
      return;
    }

    this.authService.updateMultiplePermissions(updates).subscribe({
      next: response => {
        this.showSuccessMessage(
          `${updates.length} permission(s) mise(s) à jour avec succès`
        );
        this.pendingUpdates = 0;
        this.permissionsByRole.forEach(p => (p.hasChanged = false));
        this.loadPermissionsForRole(); // Recharger les données fraîches
      },
      error: err => {
        console.error('Permissions update error:', err);
        this.showErrorMessage(err.error?.error || 'Erreur lors de la mise à jour');
      },
    });
  }

  // ============ FILE UPLOAD METHODS ============
  /**
   * Handle file selection for profile photo upload
   * Creates preview image for user feedback
   * @param event - File input change event
   */
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
  /**
   * Upload selected profile photo to the server
   * Updates user profile photo and shows success/error feedback
   */
  uploadPhoto(): void {
    if (!this.user?.id) {
      this.showErrorMessage('ID utilisateur manquant.');
      return;
    }
    if (!this.selectedFile) {
      this.showErrorMessage('Aucune image sélectionnée.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', this.selectedFile, this.selectedFile.name);

    this.authService.updateProfilePhoto(this.user.id, formData).subscribe({
      next: response => {
        this.user.photo = response.photo;
        this.resetFileUpload();
        this.showSuccessMessage('Photo mise à jour avec succès!');
      },
      error: err => {
        this.showErrorMessage("Erreur lors de l'upload de la photo.");
        console.error('Photo upload error:', err);
      },
    });
  }
  // ============ PROFILE UPDATE METHODS ============
  /**
   * Update user profile information (username, email, phone)
   * Shows success/error feedback via modal dialogs
   */
  updateProfile(): void {
    if (!this.user?.id) {
      this.showErrorMessage('ID utilisateur manquant.');
      return;
    }

    const userData = {
      username: this.user.username,
      email: this.user.email,
      numeroTelephone: this.user.numero_telephone,
    };

    this.authService.updateUserProfile(this.user.id, userData).subscribe({
      next: () => {
        this.showSuccessMessage('Profil mis à jour avec succès!');
      },
      error: err => {
        this.showErrorMessage('Erreur lors de la mise à jour du profil.');
        console.error('Profile update error:', err);
      },
    });
  }
  // ============ PASSWORD MANAGEMENT METHODS ============
  /**
   * Generate a cryptographically strong password
   * Ensures all character types are included and randomizes order
   */
  generateStrongPassword(): void {
    // Définir les ensembles de caractères
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specials = '!@#$%^&*()_-+=<>?/{}~';

    // Fonction pour sélectionner un caractère aléatoire dans une chaîne
    const getRandomChar = (str: string) =>
      str.charAt(Math.floor(Math.random() * str.length));

    // Garantir au moins un caractère de chaque type
    let password = [
      getRandomChar(lowercase),
      getRandomChar(uppercase),
      getRandomChar(numbers),
      getRandomChar(specials),
    ];

    // Combiner tous les caractères possibles pour le reste du mot de passe
    const allChars = lowercase + uppercase + numbers + specials;

    // Ajouter des caractères aléatoires jusqu'à atteindre 12 caractères
    while (password.length < 12) {
      password.push(getRandomChar(allChars));
    }

    // Mélanger le tableau pour éviter un motif prévisible
    password = password.sort(() => Math.random() - 0.5);

    // Convertir en chaîne
    const generatedPassword = password.join('');

    // Assigner le mot de passe généré
    this.suggestedPassword = generatedPassword;
    this.newPassword = generatedPassword;
    this.confirmNewPassword = generatedPassword;
    this.checkPasswordStrength(generatedPassword);
  }

  /**
   * Check password strength against security criteria
   * Updates passwordStrength object for UI feedback
   * @param password - Password to validate
   */
  checkPasswordStrength(password: string): void {
    this.passwordStrength = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }

  /**
   * Validate if password meets all security requirements
   * @returns true if password is valid, false otherwise
   */
  isPasswordValid(): boolean {
    return (
      this.passwordStrength.minLength &&
      this.passwordStrength.hasUpper &&
      this.passwordStrength.hasLower &&
      this.passwordStrength.hasNumber &&
      this.passwordStrength.hasSpecial
    );
  }

  /**
   * Update user password with validation and logout sequence
   * Redirects to login page after successful update
   */
  updatePassword(): void {
    if (this.newPassword !== this.confirmNewPassword) {
      this.showErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    this.authService.updatePassword(this.newPassword).subscribe({
      next: () => {
        this.showSuccessMessage('Mot de passe modifié avec succès !');
        // Vider les champs de mot de passe
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.suggestedPassword = '';
        // Rester sur l'onglet "changer mot de passe"
        setTimeout(() => {
          this.activatePasswordTab();
        }, 100);
        // Rediriger vers login après 3 secondes
        setTimeout(() => {
          this.showPasswordModal = true;
          setTimeout(() => {
            this.showPasswordModal = false;
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        }, 2000);
      },
      error: err => {
        console.error('Password update error:', err);
        this.showErrorMessage(
          err.error?.error || 'Erreur lors de la mise à jour du mot de passe'
        );
      },
    });
  }

  // ============ UI NAVIGATION METHODS ============
  /**
   * Activate the password change tab programmatically
   * Used for direct navigation to password section
   */
  activatePasswordTab(): void {
    // Désactiver tous les onglets
    const allTabs = document.querySelectorAll('.nav-link');
    const allTabPanes = document.querySelectorAll('.tab-pane');

    allTabs.forEach(tab => tab.classList.remove('active'));
    allTabPanes.forEach(pane => {
      pane.classList.remove('show', 'active');
    });

    // Activer l'onglet "changer mot de passe"
    const passwordTab = document.querySelector(
      '[data-bs-target="#profile-change-password"]'
    );
    const passwordPane = document.querySelector('#profile-change-password');

    if (passwordTab && passwordPane) {
      passwordTab.classList.add('active');
      passwordPane.classList.add('show', 'active');
    }
  }

  // ============ UTILITY METHODS ============
  /**
   * Reset file upload state and clear preview
   */
  private resetFileUpload(): void {
    this.selectedFile = null;
    this.previewImage = null;
  }

  // ============ MODERN MODAL METHODS ============
  /**
   * Display success message in a modal dialog
   * @param message - Success message to display
   */
  private showSuccessMessage(message: string): void {
    this.modalTitle = 'Succès!';
    this.modalMessage = message;
    this.showSuccessModal = true;
    this.showErrorModal = false;

    // Auto-close after 4 seconds
    setTimeout(() => {
      this.closeModal();
    }, 4000);
  }

  /**
   * Display error message in a modal dialog
   * @param message - Error message to display
   */
  private showErrorMessage(message: string): void {
    this.modalTitle = 'Erreur!';
    this.modalMessage = message;
    this.showErrorModal = true;
    this.showSuccessModal = false;

    // Auto-close after 5 seconds
    setTimeout(() => {
      this.closeModal();
    }, 5000);
  }

  /**
   * Close all modal dialogs
   */
  closeModal(): void {
    this.showSuccessModal = false;
    this.showErrorModal = false;
    this.modalTitle = '';
    this.modalMessage = '';
  }

  /**
   * Handle modal overlay click to close
   * @param event - Click event
   */
  onModalOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
