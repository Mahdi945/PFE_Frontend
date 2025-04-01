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
  imports: [NavbarComponent, SidebarComponent, CommonModule, FooterComponent, FormsModule, HttpClientModule,RouterModule],
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

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.userService.getAllUsers().subscribe(
      (data) => {
        this.users = data;
        this.filteredUsers = data;
      },
      (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
      }
    );
  }
  

  filterUsers(): void {
    this.filteredUsers = this.users.filter((user) =>
      (this.searchTerm === '' || 
        user.email.includes(this.searchTerm) || 
        user.numero_telephone.includes(this.searchTerm) || 
        user.username.includes(this.searchTerm)) &&
      (this.filterRole === '' || user.role === this.filterRole)
    );
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
}
