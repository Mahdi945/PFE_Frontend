import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { appConfig } from './app/app.config';
import { LoadingInterceptor } from './app/interceptors/loading.interceptor'; // Mise à jour du chemin

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers, // Utiliser les providers de appConfig s'il y en a
    provideRouter([]),  // Ajouter le système de routage
    importProvidersFrom(HttpClientModule), // HttpClientModule pour éviter les erreurs
    provideHttpClient(withInterceptors([LoadingInterceptor])) // Ajout de l'intercepteur sous forme de fonction
  ]
}).catch((err) => console.error(err));
