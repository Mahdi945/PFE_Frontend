import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';
import { FormsModule } from '@angular/forms';  // Importation du FormsModule
import { HttpClientModule } from '@angular/common/http';  // Importation de HttpClientModule
import { UserService } from '../../../services/user.service';  // Service pour récupérer les utilisateurs
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Assurez-vous que ceci est importé

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
  filterRole: string = '';
  selectedUser: any = {};  // Utilisateur sélectionné pour la mise à jour
  isModalOpen: boolean = false;  // Gérer l'état du modal
  pageSize: number = 10;  // Nombre d'utilisateurs par page (par défaut)
  currentPage: number = 1;  // Page actuelle
  totalPages: number = 1;  // Total des pages

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
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredUsers = this.users.slice(startIndex, endIndex);
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter((user) =>
      (this.searchTerm === '' || 
        user.email.includes(this.searchTerm) || 
        user.numero_telephone.includes(this.searchTerm) || 
        user.username.includes(this.searchTerm)) &&
      (this.filterRole === '' || user.role === this.filterRole)
    );
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.currentPage = 1;  // Reset à la première page
    this.updateFilteredUsers();
  }

  openModal(user: any): void {
    this.selectedUser = { ...user }; // Créer une copie de l'utilisateur sélectionné
    this.isModalOpen = true;  // Ouvrir le modal
  }

  closeModal(): void {
    this.isModalOpen = false;  // Fermer le modal
  }

  updateUser(): void {
    this.userService.updateUser(this.selectedUser.id, this.selectedUser).subscribe(
      (response) => {
        console.log('Utilisateur mis à jour avec succès', response);
        this.fetchUsers();  // Récupérer à nouveau les utilisateurs après la mise à jour
        this.closeModal();  // Fermer le modal après mise à jour
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
      this.currentPage = 1;  // Reset à la première page
      this.updateFilteredUsers();
    }
  }
}
