import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';
import { FormsModule } from '@angular/forms';  
import { HttpClientModule } from '@angular/common/http';  
import { UserService } from '../../../services/user.service';  
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-gestion-comptes',
  standalone: true,
  imports: [NavbarComponent, SidebarComponent, CommonModule, FooterComponent, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './gestion-comptes.component.html',
  styleUrls: ['./gestion-comptes.component.css']
})
export class GestionComptesComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  filterRole: string = '';
  filterStatus: string = '';
  selectedUser: any = null;
  showModal: boolean = false;
  deactivationReason: string = '';
  showMessageModal: boolean = false;
  messageTitle: string = '';
  messageContent: string = '';

  pageSize: number = 10;  
  currentPage: number = 1;  
  totalPages: number = 1;  

  roles: string[] = ['cogerant', 'client', 'pompiste', 'caissier'];

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
          user.email.includes(this.searchTerm) || 
          user.numero_telephone.includes(this.searchTerm) || 
          user.username.includes(this.searchTerm)) &&
        (this.filterRole === '' || user.role === this.filterRole) &&
        (this.filterStatus === '' || user.status === this.filterStatus)
      )
      .slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  filterUsers(): void {
    this.currentPage = 1;  
    this.updateFilteredUsers();
  }

  openDeactivateModal(user: any): void {
    this.selectedUser = user;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
    this.deactivationReason = '';
  }

  deactivateUser(): void {
    if (!this.deactivationReason.trim()) {
      this.showMessage('Erreur', 'Veuillez entrer une raison pour la désactivation.');
      return;
    }

    this.userService.deactivateUser(this.selectedUser.id, this.deactivationReason).subscribe(
      () => {
        this.showMessage('Succès', 'Utilisateur désactivé avec succès !');
        this.fetchUsers();
        this.closeModal();
      },
      (error) => {
        console.error('Erreur lors de la désactivation', error);
        this.showMessage('Erreur', 'Une erreur est survenue lors de la désactivation.');
      }
    );
  }

  reactivateUser(id: number): void {
    this.userService.reactivateUser(id).subscribe(
      () => {
        this.showMessage('Succès', 'Utilisateur réactivé avec succès !');
        this.fetchUsers();
      },
      (error) => {
        console.error('Erreur lors de la réactivation', error);
        this.showMessage('Erreur', 'Une erreur est survenue lors de la réactivation.');
      }
    );
  }

  showMessage(title: string, content: string): void {
    this.messageTitle = title;
    this.messageContent = content;
    this.showMessageModal = true;
  }

  closeMessageModal(): void {
    this.showMessageModal = false;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updateFilteredUsers();
  }
}
