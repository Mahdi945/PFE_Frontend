import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { SidebarService } from '../../services/sidebar.service'; 
import { ThemeService } from '../../services/theme.service';
import { MatIconModule } from '@angular/material/icon';  // ✅ Import de MatIconModule

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, MatIconModule],  // ✅ Ajout de MatIconModule ici
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  user: any = {}; 
  profilePhoto: string | null = null;
  isDarkMode = false;  // ✅ Ajout de cette variable pour gérer le mode sombre

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private sidebarService: SidebarService, 
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.isDarkMode = localStorage.getItem('theme') === 'dark'; // ✅ Chargement du thème actuel
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  // ✅ Méthode de bascule du thème avec mise à jour immédiate de l’icône
  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = !this.isDarkMode; // ✅ Mise à jour immédiate pour l'affichage
    console.log(`Thème basculé : ${this.isDarkMode ? 'Dark' : 'Light'}`);
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe(
      data => {
        if (Array.isArray(data) && data[0] && data[0][0]) {
          this.user = data[0][0]; 
          this.profilePhoto = this.user.photo ? 'http://localhost:3000' + this.user.photo : null;
        }
      },
      error => {
        console.error("Erreur lors du chargement du profil.");
      }
    );
  }

  logout(): void {
    this.authService.logout().subscribe(
      () => {
        this.router.navigate(['/login']);
      },
      error => {
        console.error("Erreur lors de la déconnexion.");
      }
    );
  }
}
