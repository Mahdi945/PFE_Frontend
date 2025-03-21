import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/';

  constructor(private http: HttpClient) {}


  // Connexion d'un utilisateur
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // Récupérer le profil de l'utilisateur connecté
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  // Déconnexion de l'utilisateur
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {});
  }

  // Mettre à jour le mot de passe de l'utilisateur
  updatePassword(newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-password`, { newPassword });
  }

  // Demande de réinitialisation du mot de passe
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { email });
  }

  // Réinitialisation du mot de passe
  resetPassword(newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/reset-password`, { newPassword });
  }
}
