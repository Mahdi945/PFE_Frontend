import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
 // Après
enregistrerReleve(data: {
  affectation_id: number,
  pistolet_id: number,
  index_ouverture: number,
  index_fermeture: number,
  date: string
}): Observable<any> {
  return this.http.post(`${this.baseUrl}/releves`, data);
}
    /**
     * Générer le rapport journalier
     */
    genererRapportJournalier(date: string): Observable<any> {
      return this.http.post(`${this.baseUrl}/rapports/generer`, { date });
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