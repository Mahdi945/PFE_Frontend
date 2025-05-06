import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AffectationCalendrierService {
  private apiUrl = 'http://localhost:3000/api/affectations';

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // ==================== ROUTES PROTÉGÉES ====================
  addAffectationManuelle(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-manual`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  addAffectationAutomatique(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-automatic`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  regenerateAffectations(mois: number, annee: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/regenerate`, { mois, annee }, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAffectationsByDate(date: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/date/${date}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAffectationsByMonthYear(mois: number, annee: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/month/${mois}/year/${annee}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  editAffectationManuelle(affectation: any): Observable<any> {
    if (!affectation.id) {
      return throwError(() => new Error('L\'ID de l\'affectation est requis pour la mise à jour.'));
    }

    const updatedData = {
      pompiste: affectation.pompiste,
      numero_pompe: affectation.numero_pompe,
      poste: affectation.poste,
      date: affectation.date
    };

    return this.http.put(`${this.apiUrl}/update/${affectation.id}`, updatedData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  getCurrentAffectation(pompisteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/current/${pompisteId}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }
  
  getAvailablePistolets(affectationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/pistolets/${affectationId}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== GESTION DES ERREURS ====================
  private handleError(error: any) {
    console.error('Une erreur est survenue:', error);
    return throwError(() => new Error(
      error.error?.message || error.message || 'Une erreur serveur est survenue'
    ));
  }
}