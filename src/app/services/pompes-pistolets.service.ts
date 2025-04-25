import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PompePistoletService {
  private apiUrl = 'http://localhost:3000/api';  // URL de base pour l'API
  private pompeUrl = `${this.apiUrl}/pompe`;     // Endpoint pour les pompes
  private baseUrl = `${this.apiUrl}/pistolet`; // Endpoint pour les pistolets

  constructor(private http: HttpClient) {}

  // ======================================
  // Méthodes pour la gestion des pompes
  // ======================================

  /**
   * Récupérer toutes les pompes
   * @returns Observable avec la liste des pompes
   */
  getAllPompes(): Observable<any> {
    return this.http.get(`${this.pompeUrl}/pompes`);
  }

  /**
   * Récupérer une pompe par son ID
   * @param id ID de la pompe
   * @returns Observable avec les données de la pompe
   */
  getPompeById(id: number): Observable<any> {
    return this.http.get(`${this.pompeUrl}/pompes/${id}`);
  }

  /**
   * Ajouter une nouvelle pompe
   * @param pompeData Données de la nouvelle pompe
   * @returns Observable avec la réponse du serveur
   */
  addPompe(pompeData: any): Observable<any> {
    return this.http.post(`${this.pompeUrl}/pompes`, pompeData);
  }

  /**
   * Mettre à jour une pompe existante
   * @param id ID de la pompe à modifier
   * @param pompeData Nouvelles données de la pompe
   * @returns Observable avec la réponse du serveur
   */
  updatePompe(id: number, pompeData: any): Observable<any> {
    return this.http.put(`${this.pompeUrl}/pompes/${id}`, pompeData);
  }

  /**
   * Supprimer une pompe
   * @param id ID de la pompe à supprimer
   * @returns Observable avec la réponse du serveur
   */
  deletePompe(id: number): Observable<any> {
    return this.http.delete(`${this.pompeUrl}/pompes/${id}`);
  }


    // ======================
    // Méthodes principales
    // ======================
  
    /**
     * Récupérer tous les pistolets
     */
    getAllPistolets(): Observable<any> {
      return this.http.get(`${this.baseUrl}/`);
    }
  
    /**
     * Ajouter un nouveau pistolet
     */
    addPistolet(data: {
      numero_pompe: string,
      numero_pistolet: string,
      nom_produit: string,
      prix_unitaire: number
    }): Observable<any> {
      return this.http.post(`${this.baseUrl}/add`, data);
    }
    /**
 * Ajouter un rapport journalier manuellement
 * @param data Données du rapport à ajouter
 * @returns Observable avec la réponse du serveur
 */
ajouterRapportManuel(data: {
  date_rapport: string,
  pistolet_id: number,
  total_quantite: number,
  total_montant: number
}): Observable<any> {
  return this.http.post(`${this.baseUrl}/rapports/manuel`, data).pipe(
    catchError(error => {
      console.error('Erreur lors de l\'ajout du rapport manuel:', error);
      return throwError(() => error);
    })
  );
}
    /**
     * Récupérer les pistolets d'une pompe
     */
    getPistoletsByPompeId(pompeId: number): Observable<any> {
      return this.http.get(`${this.baseUrl}/pompe/${pompeId}`);
    }
  
    /**
     * Mettre à jour le statut d'un pistolet
     */
    updateStatutPistolet(pistoletId: number, statut: 'disponible' | 'indisponible' | 'maintenance'): Observable<any> {
      return this.http.put(`${this.baseUrl}/update-statut`, {
        id: pistoletId,
        statut
      });
    }
  
    // ======================
    // Gestion des relevés
    // ======================
  
    /**
     * Enregistrer un relevé de poste
     */
    enregistrerReleve(data: {
      affectation_id: number,
      pistolet_id: number,
      index_ouverture: number,
      index_fermeture: number,
      
    }): Observable<any> {
      console.log('Envoi des données au serveur:', data);
      return this.http.post(`${this.baseUrl}/releves`, data).pipe(
        catchError((error) => {
          console.error('Erreur lors de l\'enregistrement:', error);
          console.log('Détails complets de l\'erreur:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            error: error.error
          });
          return throwError(error);
        })
      );
    }
    /**
     * Générer le rapport journalier
     */
    genererRapportJournalier(date: string | Date): Observable<any> {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      return this.http.post<{
        success: boolean;
        message: string;
        date_rapport: string;
      }>(`${this.baseUrl}/rapports/generer`, { date: dateStr }).pipe(
        catchError(error => {
          console.error('Erreur API:', error);
          return throwError(() => error);
        })
      );
    }
   
    ajouterReleveManuel(data: {
      affectation_id: number,
      pistolet_id: number,
      index_ouverture: number,
      index_fermeture: number,
      date_heure: string
    }): Observable<any> {
      return this.http.post(`${this.baseUrl}/releves/manuel`, data);
    }
  
    /**
     * Mettre à jour le statut d'un relevé
     */
    updateStatutReleve(releveId: number, statut: string): Observable<any> {
      return this.http.put(`${this.baseUrl}/${releveId}/statut`, { statut });
    }
  
    /**
     * Récupérer l'historique des relevés
     */
    getHistoriqueReleves(pistoletId: number, dateDebut: string, dateFin: string): Observable<any> {
      const params = new HttpParams()
        .set('date_debut', dateDebut)
        .set('date_fin', dateFin);
      
      return this.http.get(`${this.baseUrl}/${pistoletId}/historique`, { params });
    }
    getRevenusJournaliers(dateDebut: string, dateFin: string, pistoletId?: number): Observable<any> {
      let params = new HttpParams()
        .set('date_debut', dateDebut)
        .set('date_fin', dateFin);
  
      if (pistoletId) {
        params = params.set('pistolet_id', pistoletId.toString());
      }
  
      return this.http.get(`${this.baseUrl}/revenus-journaliers`, { params });
    }
    // ======================
    // Méthodes dépréciées (à supprimer progressivement)
    // ======================
  
    /**
     * @deprecated Utiliser enregistrerReleve() à la place
     */
    updateIndexOuverture(pistoletId: number, index: number): Observable<any> {
      return this.http.put(`${this.baseUrl}/update-ouverture`, { 
        id: pistoletId, 
        index_ouverture: index 
      });
    }
  
    /**
     * @deprecated Utiliser enregistrerReleve() à la place
     */
    updateIndexFermeture(pistoletId: number, index: number): Observable<any> {
      return this.http.put(`${this.baseUrl}/update-fermeture`, { 
        id: pistoletId, 
        index_fermeture: index 
      });
    }
  }