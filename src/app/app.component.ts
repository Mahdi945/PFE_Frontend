import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';  // Importation du service
import { SpinnerComponent } from './spinner/spinner.component'; // Importation du SpinnerComponent

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SpinnerComponent], // Importation du SpinnerComponent ici
  template: `
    <app-spinner *ngIf="isLoading"></app-spinner> <!-- Afficher le spinner quand isLoading est vrai -->
    <router-outlet></router-outlet>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Gestion Station Service';
  isLoading: boolean = false;

  constructor(private loadingService: LoadingService) {}

  ngOnInit() {
    // Écouter l'état du spinner
    this.loadingService.isLoading.subscribe((loading: boolean) => {
      this.isLoading = loading;
    });
  }
}
