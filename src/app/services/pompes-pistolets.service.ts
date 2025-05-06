import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PompePistoletService {
  private apiUrl = 'http://localhost:3000/api';
  private pompeUrl = `${this.apiUrl}/pompe`;
  private pistoletUrl = `${this.apiUrl}/pistolet`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => new Error(
      error.error?.message || error.message || 'Server error'
    ));
  }

  // ==================== POMPES ====================
  getAllPompes(): Observable<any> {
    return this.http.get(`${this.pompeUrl}/pompes`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getPompeById(id: number): Observable<any> {
    return this.http.get(`${this.pompeUrl}/pompes/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  addPompe(pompeData: any): Observable<any> {
    return this.http.post(`${this.pompeUrl}/pompes`, pompeData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  updatePompe(id: number, pompeData: any): Observable<any> {
    return this.http.put(`${this.pompeUrl}/pompes/${id}`, pompeData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  deletePompe(id: number): Observable<any> {
    return this.http.delete(`${this.pompeUrl}/pompes/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  // ==================== PISTOLETS ====================
  getAllPistolets(): Observable<any> {
    return this.http.get(`${this.pistoletUrl}/`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  addPistolet(data: {
    numero_pompe: string,
    numero_pistolet: string,
    nom_produit: string,
    prix_unitaire: number
  }): Observable<any> {
    return this.http.post(`${this.pistoletUrl}/add`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getPistoletsByPompeId(pompeId: number): Observable<any> {
    return this.http.get(`${this.pistoletUrl}/pompe/${pompeId}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  updateStatutPistolet(pistoletId: number, statut: string): Observable<any> {
    return this.http.put(`${this.pistoletUrl}/update-statut`, {
      id: pistoletId,
      statut
    }, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  // ==================== RELEVÉS ====================
  enregistrerReleve(data: {
    affectation_id: number,
    pistolet_id: number,
    index_ouverture: number,
    index_fermeture: number
  }): Observable<any> {
    return this.http.post(`${this.pistoletUrl}/releves`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  ajouterReleveManuel(data: {
    affectation_id: number,
    pistolet_id: number,
    index_ouverture: number,
    index_fermeture: number,
    date_heure: string
  }): Observable<any> {
    return this.http.post(`${this.pistoletUrl}/releves/manuel`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }
  // Nouvelle méthode pour mettre à jour le statut d'un relevé
  updateStatutReleve(releveId: number, nouveauStatut: string): Observable<any> {
    return this.http.put(
      `${this.pistoletUrl}/${releveId}/statut`, 
      { statut: nouveauStatut },
      {
        headers: this.getAuthHeaders(),
        withCredentials: true
      }
    ).pipe(catchError(this.handleError));
  }
  // ==================== RAPPORTS ====================
  genererRapportJournalier(date: string | Date): Observable<any> {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return this.http.post(`${this.pistoletUrl}/rapports/generer`, { date: dateStr }, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  ajouterRapportManuel(data: {
    date_rapport: string,
    pistolet_id: number,
    total_quantite: number,
    total_montant: number
  }): Observable<any> {
    return this.http.post(`${this.pistoletUrl}/rapports/manuel`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getHistoriqueReleves(pistoletId: number, dateDebut: string, dateFin: string): Observable<any> {
    const params = new HttpParams()
      .set('date_debut', dateDebut)
      .set('date_fin', dateFin);
    
    return this.http.get(`${this.pistoletUrl}/${pistoletId}/historique`, {
      params,
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getRevenusJournaliers(dateDebut: string, dateFin: string, pistoletId?: number): Observable<any> {
    let params = new HttpParams()
      .set('date_debut', dateDebut)
      .set('date_fin', dateFin);

    if (pistoletId) {
      params = params.set('pistolet_id', pistoletId.toString());
    }

    return this.http.get(`${this.pistoletUrl}/revenus-journaliers`, {
      params,
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  // ==================== MÉTHODES DÉPRÉCIÉES ====================
  updateIndexOuverture(pistoletId: number, index: number): Observable<any> {
    return this.http.put(`${this.pistoletUrl}/update-ouverture`, {
      id: pistoletId,
      index_ouverture: index
    }, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  updateIndexFermeture(pistoletId: number, index: number): Observable<any> {
    return this.http.put(`${this.pistoletUrl}/update-fermeture`, {
      id: pistoletId,
      index_fermeture: index
    }, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }
}