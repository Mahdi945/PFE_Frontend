import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
    RouterModule
  ],
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrls: ['./gestion-utilisateurs.component.css']
})
export class GestionUtilisateursComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  filterRole: string = '';
  filterStatus: string = '';
  selectedUser: any = {};
  isModalOpen: boolean = false;
  showDeactivateModal: boolean = false;
  showMessageModal: boolean = false;
  messageTitle: string = '';
  messageContent: string = '';
  deactivationReason: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  showRoleDropdown: { [key: number]: boolean } = {};

  roles: string[] = ['cogerant', 'client', 'pompiste', 'caissier'];
  statuses: string[] = ['active', 'inactive'];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.userService.getAllUsers().subscribe(
      (data) => {
        this.users = data;
        this.totalPages = Math.ceil(this.users.length / this.pageSize);
        this.updateFilteredUsers();
      },
      (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
      }
    );
  }

  updateFilteredUsers(): void {
    this.filteredUsers = this.users
      .filter(user =>
        (this.searchTerm === '' || 
          user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
          user.numero_telephone.includes(this.searchTerm) || 
          user.username.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
        (this.filterRole === '' || user.role === this.filterRole) &&
        (this.filterStatus === '' || user.status === this.filterStatus)
      )
      .slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  filterUsers(): void {
    this.currentPage = 1;
    this.updateFilteredUsers();
  }

  openEditModal(user: any): void {
    this.selectedUser = { ...user };
    this.isModalOpen = true;
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
      (response) => {
        this.showMessage('Succès', 'Utilisateur mis à jour avec succès');
        this.fetchUsers();
        this.closeEditModal();
      },
      (error) => {
        this.showMessage('Erreur', 'Une erreur est survenue lors de la mise à jour');
        console.error('Erreur lors de la mise à jour de l\'utilisateur', error);
      }
    );
  }

  deactivateUser(): void {
    if (!this.deactivationReason.trim()) {
      this.showMessage('Erreur', 'Veuillez entrer une raison pour la désactivation');
      return;
    }

    this.userService.deactivateUser(this.selectedUser.id, this.deactivationReason).subscribe(
      () => {
        this.showMessage('Succès', 'Utilisateur désactivé avec succès');
        this.fetchUsers();
        this.closeDeactivateModal();
      },
      (error) => {
        this.showMessage('Erreur', 'Une erreur est survenue lors de la désactivation');
        console.error('Erreur lors de la désactivation', error);
      }
    );
  }

  reactivateUser(id: number): void {
    this.userService.reactivateUser(id).subscribe(
      () => {
        this.showMessage('Succès', 'Utilisateur réactivé avec succès');
        this.fetchUsers();
      },
      (error) => {
        this.showMessage('Erreur', 'Une erreur est survenue lors de la réactivation');
        console.error('Erreur lors de la réactivation', error);
      }
    );
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
    const updatedUser = { ...user, role: newRole };
    this.userService.updateUser(user.id, updatedUser).subscribe(
      () => {
        this.showMessage('Succès', 'Rôle mis à jour avec succès');
        this.fetchUsers();
        this.showRoleDropdown[user.id] = false;
      },
      (error) => {
        this.showMessage('Erreur', 'Échec de la mise à jour du rôle');
        console.error('Erreur lors du changement de rôle', error);
      }
    );
  }
}