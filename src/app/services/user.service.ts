import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/'; 

  constructor(private http: HttpClient) {}

  // Récupérer tous les utilisateurs
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  // Récupérer un utilisateur par ID
  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${id}`);
  }

  // Récupérer un utilisateur par email
  getUserByEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/email/${email}`);
  }

  // Récupérer un utilisateur par username
  getUserByUsername(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/username/${username}`);
  }
  addUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }
  // Mettre à jour un utilisateur
  updateUser(id: number, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, userData);
  }

  // Supprimer un utilisateur
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/${id}`);
  }
  // Désactiver un utilisateur
  deactivateUser(id: number, reason: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/desactiver/${id}`, { reason });
  }

  // Réactiver un utilisateur
  reactivateUser(id: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/reactiver/${id}`, {});
  }

}
