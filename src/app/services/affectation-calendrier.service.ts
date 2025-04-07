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

  editAffectationManuelle(affectation: any): Observable<any> {
    if (!affectation.id) {
      throw new Error('L\'ID de l\'affectation est requis pour la mise à jour.');
    }
  
    // Construire dynamiquement les données à envoyer
    const updatedData: any = {};
  
    if (affectation.pompiste) {
      updatedData.pompiste = affectation.pompiste;
    }
    if (affectation.numero_pompe) {
      updatedData.numero_pompe = affectation.numero_pompe;
    }
    if (affectation.poste) {
      updatedData.poste = affectation.poste;
    }
    if (affectation.calendrier_id) {
      updatedData.calendrier_id = affectation.calendrier_id;
    }
  
    console.log('Données envoyées au backend :', updatedData);
  
    // Envoyer uniquement les champs modifiés au backend
    return this.http.put<any>(`${this.apiUrl}/update/${affectation.id}`, updatedData);
  }

  // Obtenir un calendrier par date
  getCalendrierByDate(date: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/date/${date}`);
  }


}
