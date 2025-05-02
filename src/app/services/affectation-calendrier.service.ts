import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AffectationCalendrierService {
  private apiUrl = 'http://localhost:3000/api/affectations';

  constructor(private http: HttpClient) {}

  addAffectationManuelle(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-manual`, data);
  }

  addAffectationAutomatique(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-automatic`, data);
  }

  regenerateAffectations(mois: number, annee: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/regenerate`, { mois, annee });
  }

  getAffectationsByDate(date: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/date/${date}`);
  }

  getAffectationsByMonthYear(mois: number, annee: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/month/${mois}/year/${annee}`);
  }

  editAffectationManuelle(affectation: any): Observable<any> {
    if (!affectation.id) {
      throw new Error('L\'ID de l\'affectation est requis pour la mise à jour.');
    }

    const updatedData = {
      pompiste: affectation.pompiste,
      numero_pompe: affectation.numero_pompe,
      poste: affectation.poste,
      date: affectation.date
    };

    return this.http.put<any>(`${this.apiUrl}/update/${affectation.id}`, updatedData);
  }
  getCurrentAffectation(pompisteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/current/${pompisteId}`);
  }
  
  getAvailablePistolets(affectationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/pistolets/${affectationId}`);
  }
}