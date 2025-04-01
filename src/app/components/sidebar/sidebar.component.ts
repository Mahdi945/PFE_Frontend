import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service'; // Assurez-vous d'importer le service Auth
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Assurez-vous que ceci est importé

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isSidebarVisible: boolean = true;
  userRole: string = ''; // Variable pour stocker le rôle de l'utilisateur
  user: any = {}; // Stocker les données de l'utilisateur

  constructor(private sidebarService: SidebarService, private authService: AuthService) {}

  ngOnInit(): void {
    this.sidebarService.sidebarState$.subscribe(state => {
      this.isSidebarVisible = state;
    });

    // Récupérer le profil de l'utilisateur et définir son rôle
    this.authService.getProfile().subscribe(
      data => {
        if (Array.isArray(data) && data[0] && data[0][0]) {
          this.user = data[0][0]; // Récupérer les données de l'utilisateur
          this.userRole = this.user.role; // Accéder au rôle de l'utilisateur
        }
      },
      error => {
        console.error("Erreur lors du chargement du profil.");
      }
    );
  }
}
