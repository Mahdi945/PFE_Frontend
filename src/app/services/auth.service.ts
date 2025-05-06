import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  public currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private sessionExpiredSubject = new BehaviorSubject<string | null>(null);
  sessionExpiredMessage$ = this.sessionExpiredSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Charger le profil au démarrage si possible
    this.getProfile().subscribe();
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, {
      withCredentials: true // Essentiel pour les cookies
    }).pipe(
      tap((response: any) => {
        if (response?.success) {
          this.currentUserSubject.next(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, {
      withCredentials: true // Essentiel pour les cookies
    }).pipe(
      tap(profile => {
        this.currentUserSubject.next(profile);
      }),
      catchError(error => {
        this.currentUserSubject.next(null);
        return this.handleError(error);
      })
    );
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { email }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(catchError(this.handleError.bind(this)));
  }

  resetPassword(newPassword: string, token: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/reset-password`, { newPassword }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      params: { token }
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== ROUTES PROTÉGÉES ====================


  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { 
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true 
    }).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateProfilePhoto(userId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-photo/${userId}`, formData, {
      withCredentials: true
    }).pipe(catchError(this.handleError.bind(this)));
  }

  updateUserProfile(userId: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-profile/${userId}`, userData, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    }).pipe(catchError(this.handleError.bind(this)));
  }

  updatePassword(newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-password`, { newPassword }, { 
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== FONCTIONS UTILITAIRES ====================
  getPermissionsByRole(role: string): Observable<any[]> {
    const normalizedRole = role.toLowerCase();
    return this.http.get<any[]>(`${this.apiUrl}/permissions/role/${normalizedRole}`, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    }).pipe(catchError(() => of([])));
  }

  hasPermission(permissionName: string): Observable<boolean> {
    return this.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user?.role) return of(false);
        return this.getPermissionsByRole(user.role.toLowerCase()).pipe(
          map(permissions => permissions.some(p => 
            p.element_name === permissionName && p.is_visible === 1
          ))
        );
      }),
      catchError(() => of(false))
    );
  }

  getPermissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/permissions`, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    });
  }

  getAllRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/permissions/roles`, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    }).pipe(catchError(this.handleError.bind(this)));
  }

  updatePermission(data: { role: string, element_name: string, is_visible: boolean }): Observable<any> {
    return this.http.post(`${this.apiUrl}/permissions/update`, data, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    });
  }

  updateMultiplePermissions(updates: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/permissions/update-multiple`, { updates }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    });
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      this.currentUserSubject.next(null);
      this.sessionExpiredSubject.next('Votre session a expiré. Veuillez vous reconnecter.');
      this.router.navigate(['/login']);
    }
    return throwError(() => error);
  }
}