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
  selector: 'app-gestion-utilisateurs',
  standalone: true,
  imports: [NavbarComponent, SidebarComponent, CommonModule, FooterComponent, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrls: ['./gestion-utilisateurs.component.css']
})
export class GestionUtilisateursComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  filterRole: string = ''; // Role sélectionné (vide pour "Tous les rôles")
  filterStatus: string = ''; // Statut sélectionné (vide pour "Tous les statuts")
  selectedUser: any = {};
  isModalOpen: boolean = false;
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  roles: string[] = ['cogerant', 'client', 'pompiste', 'caissier']; // Liste des rôles disponibles
  statuses: string[] = ['active', 'inactive']; // Liste des statuts disponibles

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.userService.getAllUsers().subscribe(
      (data) => {
        this.users = data;
        this.totalPages = Math.ceil(this.users.length / this.pageSize);
        this.updateFilteredUsers();  // Appliquer la filtration initiale après la récupération des utilisateurs
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
      .slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);  // Gestion de la pagination
  }

  filterUsers(): void {
    this.currentPage = 1;  // Revenir à la première page lors de l'application du filtre
    this.updateFilteredUsers();  // Mettre à jour les utilisateurs filtrés
  }

  openModal(user: any): void {
    this.selectedUser = { ...user };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  updateUser(): void {
    this.userService.updateUser(this.selectedUser.id, this.selectedUser).subscribe(
      (response) => {
        console.log('Utilisateur mis à jour avec succès', response);
        this.fetchUsers();  // Récupérer les utilisateurs après la mise à jour
        this.closeModal();
      },
      (error) => {
        console.error('Erreur lors de la mise à jour de l\'utilisateur', error);
      }
    );
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateFilteredUsers();
    }
  }

  changePageSize(): void {
    const parsedSize = parseInt(this.pageSize.toString(), 10);
    if (!isNaN(parsedSize) && parsedSize > 0) {
      this.pageSize = parsedSize;
      this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
      this.currentPage = 1;
      this.updateFilteredUsers();
    }
  }
}
