import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GestionReclamationsService {
  private baseUrl = `${environment.apiUrl}/api/Reclamation`;
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  envoyerReclamation(reclamationData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/add`, reclamationData, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        catchError(error => {
          console.error("Erreur lors de l'envoi de la réclamation:", error);
          return throwError(
            () =>
              new Error(
                error.error?.message ||
                  "Une erreur est survenue lors de l'envoi de la réclamation"
              )
          );
        })
      );
  }

  getReclamationsClient(idClient: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/client/${idClient}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        catchError(error => {
          console.error(
            'Erreur lors de la récupération des réclamations client:',
            error
          );
          return throwError(
            () =>
              new Error(
                error.error?.message ||
                  'Une erreur est survenue lors de la récupération des réclamations'
              )
          );
        })
      );
  }

  getReclamationDetails(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/${id}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des détails:', error);
          return throwError(
            () =>
              new Error(
                error.error?.message ||
                  'Une erreur est survenue lors de la récupération des détails'
              )
          );
        })
      );
  }

  updateReclamationStatus(id: number, statut: string): Observable<any> {
    return this.http
      .put(
        `${this.baseUrl}/${id}/statut`,
        { statut },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true,
        }
      )
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la mise à jour du statut:', error);
          return throwError(
            () =>
              new Error(
                error.error?.message ||
                  'Une erreur est survenue lors de la mise à jour du statut'
              )
          );
        })
      );
  }

  getAllReclamations(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des réclamations:', error);
          return throwError(
            () =>
              new Error(
                error.error?.message ||
                  'Une erreur est survenue lors de la récupération des réclamations'
              )
          );
        })
      );
  }
}
