import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-gestion-utilisateurs',
  standalone: true,
  imports: [
    NavbarComponent,
    SidebarComponent,
    CommonModule,
    FooterComponent,
    FormsModule,
    HttpClientModule,
    RouterModule,
  ],
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrls: ['./gestion-utilisateurs.component.css'],
})
export class GestionUtilisateursComponent implements OnInit {
  apiUrl = environment.apiUrl;
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  filterRole: string = '';
  filterStatus: string = 'active';  // Par défaut, afficher uniquement les utilisateurs activés
  selectedUser: any = {};
  isModalOpen: boolean = false;
  showDeactivateModal: boolean = false;
  showReactivateModal: boolean = false;
  showUserModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  showMessageModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  messageTitle: string = '';
  messageContent: string = '';
  deactivationReason: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  showRoleDropdown: { [key: number]: boolean } = {};

  roles: string[] = ['Cogerant', 'client', 'pompiste', 'caissier'];
  statuses: string[] = ['active', 'inactive'];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.userService.getAllUsers().subscribe(
      data => {
        this.users = data;
        this.totalPages = Math.ceil(this.users.length / this.pageSize);
        this.updateFilteredUsers();
      },
      error => {
        console.error('Erreur lors du chargement des utilisateurs', error);
      }
    );
  }

  updateFilteredUsers(): void {
    this.filteredUsers = this.users
      .filter(
        user =>
          (this.searchTerm === '' ||
            user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.numero_telephone.includes(this.searchTerm) ||
            user.username.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
          (this.filterRole === '' || user.role === this.filterRole) &&
          (this.filterStatus === '' || user.status === this.filterStatus)
      )
      .slice(
        (this.currentPage - 1) * this.pageSize,
        this.currentPage * this.pageSize
      );
  }

  filterUsers(): void {
    this.currentPage = 1;
    this.updateFilteredUsers();
  }

  openEditModal(user: any): void {
    this.selectedUser = { ...user };
    this.isModalOpen = true;
  }
  resetFilters(): void {
    // 1. Réinitialisation des variables de filtrage
    this.searchTerm = ''; // Vide la recherche textuelle
    this.filterRole = ''; // Désélectionne le filtre de rôle
    this.filterStatus = ''; // Désélectionne le filtre de statut

    // 2. Relance le filtrage pour actualiser la liste
    this.filterUsers();

    // 3. (Optionnel) Feedback utilisateur
    console.log('Filtres réinitialisés');

    // 4. (Optionnel) Remise du focus sur le champ de recherche
    this.setFocusOnSearch();
  }

  // Méthode helper optionnelle pour le focus
  private setFocusOnSearch(): void {
    setTimeout(() => {
      const searchElement = document.getElementById('searchInput');
      if (searchElement) {
        searchElement.focus();
      }
    }, 100);
  }
  closeEditModal(): void {
    this.isModalOpen = false;
  }

  openDeactivateModal(user: any): void {
    this.selectedUser = { ...user };
    this.showDeactivateModal = true;
  }

  closeDeactivateModal(): void {
    this.showDeactivateModal = false;
    this.deactivationReason = '';
  }

  closeMessageModal(): void {
    this.showMessageModal = false;
  }

  showMessage(title: string, content: string): void {
    this.messageTitle = title;
    this.messageContent = content;
    this.showMessageModal = true;
  }

  updateUser(): void {
    this.userService.updateUser(this.selectedUser.id, this.selectedUser).subscribe(
      response => {
        this.showMessage('Succès', 'Utilisateur mis à jour avec succès');
        this.fetchUsers();
        this.closeEditModal();
      },
      error => {
        this.showMessage('Erreur', 'Une erreur est survenue lors de la mise à jour');
        console.error("Erreur lors de la mise à jour de l'utilisateur", error);
      }
    );
  }
  deactivateUser(): void {
    if (!this.deactivationReason.trim()) {
      this.showError('Veuillez entrer une raison pour la désactivation');
      return;
    }

    this.userService
      .deactivateUser(this.selectedUser.id, this.deactivationReason)
      .subscribe(
        () => {
          this.showSuccess('Utilisateur désactivé avec succès');
          this.fetchUsers();
          this.closeDeactivateModal();
        },
        error => {
          this.showError('Une erreur est survenue lors de la désactivation');
          console.error('Erreur lors de la désactivation', error);
        }
      );
  }

  // Méthodes pour le modal utilisateur
  openUserModal(user: any): void {
    this.selectedUser = { ...user };
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = {};
  }

  openReactivateModal(user: any): void {
    this.selectedUser = { ...user };
    this.showReactivateModal = true;
  }

  closeReactivateModal(): void {
    this.showReactivateModal = false;
    this.selectedUser = {};
  }

  onModalOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeDeactivateModal();
      this.closeReactivateModal();
      this.closeSuccessModal();
      this.closeErrorModal();
      this.closeUserModal();
    }
  }

  reactivateUser(): void {
    if (!this.selectedUser?.id) return;

    this.userService.reactivateUser(this.selectedUser.id).subscribe(
      () => {
        this.showSuccess('Utilisateur réactivé avec succès');
        this.fetchUsers();
        this.closeReactivateModal();
      },
      error => {
        this.showError('Une erreur est survenue lors de la réactivation');
        console.error('Erreur lors de la réactivation', error);
      }
    );
  }
  updateUserRole(): void {
    if (!this.selectedUser?.id) return;

    // Utiliser la même logique que changeUserRole qui fonctionne
    const updatedUser = { ...this.selectedUser };
    this.userService.updateUser(this.selectedUser.id, updatedUser).subscribe(
      () => {
        this.showSuccess('Rôle utilisateur mis à jour avec succès');
        this.fetchUsers();
        this.closeUserModal();
      },
      error => {
        this.showError('Une erreur est survenue lors de la mise à jour du rôle');
        console.error('Erreur lors de la mise à jour du rôle', error);
      }
    );
  }

  // Méthodes pour les modales modernes
  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
  }
  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateFilteredUsers();
    }
  }

  toggleRoleDropdown(userId: number): void {
    this.showRoleDropdown[userId] = !this.showRoleDropdown[userId];
  }
  changeUserRole(user: any, newRole: string): void {
    console.log('Changement de rôle:', {
      userId: user.id,
      oldRole: user.role,
      newRole: newRole,
    });

    const updatedUser = { ...user, role: newRole };

    // Fermer d'abord le modal utilisateur si ouvert
    if (this.showUserModal) {
      this.closeUserModal();
    }

    this.userService.updateUser(user.id, updatedUser).subscribe(
      response => {
        console.log('Succès de la mise à jour:', response);
        this.fetchUsers();
        this.showRoleDropdown[user.id] = false;
        // Afficher le modal de succès après fermeture du modal utilisateur
        setTimeout(() => {
          this.showSuccess('Rôle mis à jour avec succès');
        }, 100);
      },
      error => {
        console.error('Erreur lors du changement de rôle:', error);
        // Afficher le modal d'erreur après fermeture du modal utilisateur
        setTimeout(() => {
          this.showError(
            'Échec de la mise à jour du rôle: ' +
              (error.error?.message || error.message || 'Erreur inconnue')
          );
        }, 100);
      }
    );
  }
  // Méthode pour formater l'affichage des rôles correctement
  formatRole(role: string): string {
    switch (role) {
      case 'Cogerant':
        return 'Cogerant';
      case 'client':
        return 'Client';
      case 'pompiste':
        return 'Pompiste';
      case 'caissier':
        return 'Caissier';
      default:
        return role;
    }
  }
}
