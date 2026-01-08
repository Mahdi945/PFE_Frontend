import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service'; // Importation du service
import { ThemeService } from './services/theme.service'; // Importation du ThemeService
import { SpinnerComponent } from './spinner/spinner.component'; // Importation du SpinnerComponent
import { ChatComponent } from './components/chat/chat.component'; // Importation du composant ChatComponent

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SpinnerComponent, ChatComponent], // Importation du SpinnerComponent ici
  template: `
    <app-spinner *ngIf="isLoading"></app-spinner>
    <!-- Afficher le spinner quand isLoading est vrai -->
    <router-outlet></router-outlet>
    <app-chat></app-chat>
  `,
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Gestion Station Service';
  isLoading: boolean = false;

  constructor(
    private loadingService: LoadingService,
    private themeService: ThemeService
  ) {
    // Charger le thème au démarrage de l'application
    this.themeService.loadTheme();
  }

  ngOnInit() {
    // Écouter l'état du spinner
    this.loadingService.isLoading.subscribe((loading: boolean) => {
      this.isLoading = loading;
    });
  }
}
