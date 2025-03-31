import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Assurez-vous que HttpClient et HttpHeaders sont importés
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Connexion d'un utilisateur
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  // Récupérer le profil de l'utilisateur connecté
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, { withCredentials: true });
  }


  // Mettre à jour la photo de profil
  updateProfilePhoto(userId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-photo/${userId}`, formData, {
      headers: new HttpHeaders(),
      withCredentials: true
    });
  }
  updateUserProfile(userId: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-profile/${userId}`, userData, {
      headers: new HttpHeaders(), // Similaire à updateProfilePhoto
      withCredentials: true // Permet d'envoyer les cookies (JWT, session, etc.)
    });
  }
  
  

  // Déconnexion de l'utilisateur
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }

  // Mettre à jour le mot de passe de l'utilisateur
  updatePassword(newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-password`, { newPassword }, { withCredentials: true });
  }

  // Demander une réinitialisation de mot de passe
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { email });
  }

  // Réinitialiser le mot de passe avec un token
  resetPassword(newPassword: string, token: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/reset-password?token=${token}`, { newPassword });
  }
}
