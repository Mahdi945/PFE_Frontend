import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AffectationCalendrierService {
  private apiUrl = 'http://localhost:3000/api/affectations'; // Remplace par ton URL réelle

  constructor(private http: HttpClient) {}

  addAffectationManuelle(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-manual`, data);
  }

  addAffectationAutomatique(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-automatic`, data);
  }

  getAffectationsByJour(calendrier_id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/jour/${calendrier_id}`);
  }

  getAffectationsByMonthYear(mois: number, annee: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/month/${mois}/year/${annee}`);
  }
  // Méthode pour ajouter/modifier une affectation manuellement
  editAffectationManuelle(affectation: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${affectation.id}`, affectation);
  }
  // Obtenir un calendrier par date
  getCalendrierByDate(date: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/date/${date}`);
}

}
