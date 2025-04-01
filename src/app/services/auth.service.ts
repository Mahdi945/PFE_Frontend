import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private sessionExpiredSubject = new BehaviorSubject<string | null>(null);
  sessionExpiredMessage$ = this.sessionExpiredSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // Connexion d'un utilisateur
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Récupérer le profil de l'utilisateur connecté
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, { withCredentials: true })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Mettre à jour la photo de profil
  updateProfilePhoto(userId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-photo/${userId}`, formData, {
      headers: new HttpHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // Mettre à jour les informations de l'utilisateur
  updateUserProfile(userId: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-profile/${userId}`, userData, {
      headers: new HttpHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // Déconnexion de l'utilisateur
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Mettre à jour le mot de passe de l'utilisateur
  updatePassword(newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-password`, { newPassword }, { withCredentials: true })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Demander une réinitialisation de mot de passe
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { email })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Réinitialiser le mot de passe avec un token
  resetPassword(newPassword: string, token: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/reset-password?token=${token}`, { newPassword })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Gestion des erreurs
  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      this.sessionExpiredSubject.next('Votre session a expiré. Veuillez vous reconnecter.');
      this.router.navigate(['/login']);
    }
    return throwError(() => error);
  }
}
