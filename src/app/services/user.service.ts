import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, {
      headers: this.getAuthHeaders(),
      withCredentials: true,
    });
  }

  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true,
    });
  }

  getUserByEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/email/${email}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true,
    });
  }

  getUserByUsername(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/username/${username}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true,
    });
  }

  addUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData, {
      headers: this.getAuthHeaders(),
      withCredentials: true,
    });
  }

  updateUser(id: number, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, userData, {
      headers: this.getAuthHeaders(),
      withCredentials: true,
    });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true,
    });
  }

  deactivateUser(id: number, reason: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/desactiver/${id}`,
      { reason },
      {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  reactivateUser(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/reactiver/${id}`,
      {},
      {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      }
    );
  }
}
