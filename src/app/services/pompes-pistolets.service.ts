import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PompePistoletService {
  private apiUrl = 'http://localhost:3000/api/pompe';  // L'URL de base pour les routes

  constructor(private http: HttpClient) {}

  // Récupérer toutes les pompes
  getAllPompes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pompes`);
  }

  // Récupérer une pompe par ID
  getPompeById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/pompes/${id}`);
  }

  // Ajouter une nouvelle pompe
  addPompe(pompeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pompes`, pompeData);
  }

  // Mettre à jour une pompe existante
  updatePompe(id: number, pompeData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/pompes/${id}`, pompeData);
  }

  // Supprimer une pompe par ID
  deletePompe(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pompes/${id}`);
  }

}