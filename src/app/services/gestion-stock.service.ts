import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GestionStockService {
  private baseUrl = `${environment.apiUrl}/api/stock`;
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  private getFormDataHeaders() {
    return new HttpHeaders({
      Accept: 'application/json',
    });
  }

  // ==================== PRODUITS ====================
  createProduit(produitData: any, imageFile: File | null): Observable<any> {
    const formData = new FormData();

    // Ajouter les données du produit
    Object.keys(produitData).forEach(key => {
      if (produitData[key] !== null && produitData[key] !== undefined) {
        formData.append(key, produitData[key]);
      }
    });

    // Ajouter l'image si elle existe
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http
      .post(`${this.baseUrl}/produits`, formData, {
        headers: this.getFormDataHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  updateProduit(
    id: number,
    produitData: any,
    imageFile: File | null
  ): Observable<any> {
    const formData = new FormData();

    // Ajouter les données du produit
    Object.keys(produitData).forEach(key => {
      if (produitData[key] !== null && produitData[key] !== undefined) {
        formData.append(key, produitData[key]);
      }
    });

    // Ajouter l'image si elle existe
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http
      .put(`${this.baseUrl}/produits/${id}`, formData, {
        headers: this.getFormDataHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  deleteProduit(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/produits/${id}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getProduit(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/produits/${id}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getAllProduits(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/produits`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getProduitsLowStock(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/produits/low-stock`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  // ==================== CATÉGORIES ====================
  createCategorie(categorieData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/categories`, categorieData, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  updateCategorie(id: number, categorieData: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/categories/${id}`, categorieData, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  deleteCategorie(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/categories/${id}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getCategorie(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/categories/${id}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getAllCategories(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/categories`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  // ==================== MOUVEMENTS STOCK ====================
  createMouvement(mouvementData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/mouvements`, mouvementData, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getMouvementsByProduit(produitId: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/mouvements/produit/${produitId}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getMouvementsByDate(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http
      .get(`${this.baseUrl}/mouvements`, {
        params,
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }
  // ==================== VENTES ====================
  createVente(venteData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/ventes`, venteData, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getVente(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/ventes/${id}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getVentesByDate(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http
      .get(`${this.baseUrl}/ventes`, {
        params,
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getVentesByCaissier(
    caissierId: number,
    startDate: string,
    endDate: string
  ): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http
      .get(`${this.baseUrl}/ventes/caissier/${caissierId}`, {
        params,
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  cancelVente(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/ventes/${id}/cancel`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  // Nouvelle méthode pour récupérer les lignes de vente
  getLignesVente(venteId: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/ventes/${venteId}/lignes`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  // ==================== STATISTIQUES ====================
  getStockStats(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/stats/stock`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getVentesStats(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http
      .get(`${this.baseUrl}/stats/ventes`, {
        params,
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }
  // ==================== STATISTIQUES AVANCÉES ====================

  /**
   * Récupère les statistiques détaillées des ventes sur une période
   * @param startDate - Date de début (format: YYYY-MM-DD)
   * @param endDate - Date de fin (format: YYYY-MM-DD)
   */
  getVentesStatsDetaillees(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http
      .get(`${this.baseUrl}/stats/ventes`, {
        params,
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        catchError(error => {
          console.error(
            'Erreur lors de la récupération des statistiques de ventes:',
            error
          );
          return throwError(
            () => new Error('Impossible de récupérer les statistiques de ventes')
          );
        })
      );
  }

  /**
   * Récupère les statistiques complètes des commandes d'achat
   * @param startDate - Date de début (optionnel)
   * @param endDate - Date de fin (optionnel)
   */
  getCommandesAchatStats(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();

    if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }

    return this.http
      .get(`${this.baseUrl}/stats/commandes-achat`, {
        params,
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        catchError(error => {
          console.error(
            'Erreur lors de la récupération des statistiques de commandes:',
            error
          );
          return throwError(
            () =>
              new Error(
                "Impossible de récupérer les statistiques de commandes d'achat"
              )
          );
        })
      );
  }

  /**
   * Récupère les statistiques globales du stock en temps réel
   * Inclut: produits en stock bas, ventes du jour, top produits
   */
  getStockStatsGlobales(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/stats/stock`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        catchError(error => {
          console.error(
            'Erreur lors de la récupération des statistiques de stock:',
            error
          );
          return throwError(
            () => new Error('Impossible de récupérer les statistiques de stock')
          );
        })
      );
  }

  /**
   * Récupère un tableau de bord complet avec toutes les statistiques
   * @param periode - Période pour les filtres (optionnel)
   */
  getDashboardComplet(periode?: {
    startDate: string;
    endDate: string;
  }): Observable<any> {
    // Combine toutes les statistiques en une seule requête
    const stockStats$ = this.getStockStatsGlobales();
    const commandesStats$ = periode
      ? this.getCommandesAchatStats(periode.startDate, periode.endDate)
      : this.getCommandesAchatStats();
    const ventesStats$ = periode
      ? this.getVentesStatsDetaillees(periode.startDate, periode.endDate)
      : this.getVentesStats(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          new Date().toISOString().split('T')[0]
        );

    // Utilisation de forkJoin pour récupérer toutes les données en parallèle
    return forkJoin({
      stock: stockStats$,
      commandes: commandesStats$,
      ventes: ventesStats$,
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération du dashboard complet:', error);
        return throwError(
          () => new Error('Impossible de récupérer les données du dashboard')
        );
      })
    );
  }

  // ==================== FOURNISSEURS ====================
  createFournisseur(fournisseurData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/fournisseurs`, fournisseurData, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getAllFournisseurs(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/fournisseurs`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getFournisseur(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/fournisseurs/${id}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  updateFournisseur(id: number, fournisseurData: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/fournisseurs/${id}`, fournisseurData, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  deleteFournisseur(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/fournisseurs/${id}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  // ==================== COMMANDES D'ACHAT ====================
  createCommandeAchat(commandeData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/commandes-achat`, commandeData, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  getAllCommandesAchat(filters?: any): Observable<any> {
    let params = new HttpParams();

    if (filters) {
      if (filters.fournisseur_id) {
        params = params.set('fournisseur_id', filters.fournisseur_id.toString());
      }
      if (filters.statut) {
        params = params.set('statut', filters.statut);
      }
      if (filters.startDate) {
        params = params.set('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params = params.set('endDate', filters.endDate);
      }
    }

    return this.http
      .get(`${this.baseUrl}/commandes-achat`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
        params: params,
      })
      .pipe(catchError(this.handleError));
  }

  getCommandeAchat(commandeId: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/commandes-achat/${commandeId}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  updateCommandeAchat(id: number, commandeData: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/commandes-achat/${id}`, commandeData, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  deleteCommandeAchat(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/commandes-achat/${id}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  // Actions spécifiques sur les commandes
  validerCommandeAchat(commandeId: number, agentId?: number): Observable<any> {
    const requestBody = agentId ? { agent_id: agentId } : {};
    return this.http
      .post(`${this.baseUrl}/commandes-achat/${commandeId}/valider`, requestBody, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  recevoirCommandeAchat(commandeId: number, agentId?: number): Observable<any> {
    const requestBody = agentId ? { agent_id: agentId } : {};
    return this.http
      .post(`${this.baseUrl}/commandes-achat/${commandeId}/recevoir`, requestBody, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  annulerCommandeAchat(commandeId: number, agentId?: number): Observable<any> {
    const requestBody = agentId ? { agent_id: agentId } : {};
    return this.http
      .post(`${this.baseUrl}/commandes-achat/${commandeId}/annuler`, requestBody, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  // Commandes par fournisseur
  getCommandesAchatByFournisseur(fournisseurId: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/fournisseurs/${fournisseurId}/commandes`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  receptionnerCommande(commandeId: number): Observable<any> {
    return this.http
      .post(
        `${this.baseUrl}/commandes-achat/${commandeId}/reception`,
        {},
        {
          headers: this.getAuthHeaders(),
          withCredentials: true,
        }
      )
      .pipe(catchError(this.handleError));
  }

  // Nouvelle méthode pour récupérer les lignes de commande
  getLignesCommande(commandeId: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/commandes-achat/${commandeId}/lignes`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }
  // ==================== UTILISATEURS ====================
  getAllUsers(): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/users`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  // ==================== GESTION DES ERREURS ====================
  private handleError(error: any): Observable<never> {
    console.error('Erreur dans GestionStockService:', error);

    let errorMessage = 'Une erreur est survenue lors de la gestion du stock';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else if (error.error?.message) {
      // Erreur côté serveur avec message
      errorMessage = error.error.message;
    } else if (error.status) {
      // Erreur HTTP avec statut
      errorMessage = `Erreur ${error.status}: ${error.statusText}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
