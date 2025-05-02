import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GestionCreditsService {
  private baseUrl = 'http://localhost:3000/api/Credit'; // Base URL pour toutes les routes
  private apiUrl = 'http://localhost:3000/api'; // Base URL pour toutes les routes

  constructor(private http: HttpClient) { }

  // ==================== CRÉDITS ====================
  addCredit(creditData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/credits/add`, creditData);
  }

  updateCredit(creditData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/credits/update`, creditData);
  }

  getAllCredits(): Observable<any> {
    return this.http.get(`${this.baseUrl}/credits/all`);
  }

  getCreditById(id_credit: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/credits/${id_credit}`);
  }

  getCreditsByUser(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/credits/${id_utilisateur}`);
  }

  getCreditStats(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/credit-stats/${id_utilisateur}`);
  }

  updateCreditState(creditStateData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/credits/state`, creditStateData);
  }

  deleteCredit(id_credit: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/credits/${id_credit}`);
  }
  renewCredit(creditData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/credits/renew`, creditData);
  }
  // Récupérer tous les utilisateurs
    getAllUsers(): Observable<any> {
      return this.http.get(`${this.apiUrl}/users`);
  }

  // ==================== VÉHICULES ====================
  addVehicule(vehiculeData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/vehicules/add`, vehiculeData);
  }

  getVehiculeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules/${id}`);
  }

  getVehiculesByClient(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules/client/${username}`);
  }

  getVehiculesByCredit(id_credit: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules/credit/${id_credit}`);
  }

  getAllVehicules(): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules`);
  }

  getVehiculeByImmatriculation(immatriculation: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules/immatriculation/${immatriculation}`);
  }

  updateVehicule(vehiculeData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/vehicules/update`, vehiculeData);
  }

  deleteVehicule(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/vehicules/${id}`);
  }

  // ==================== PAIEMENTS ====================
  createPayment(paymentData: {
    id_credit: number,
    montant_paye: number,
    mode_paiement: string,
    description?: string
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/paiments/create`, paymentData);
  }

  getAllPayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/paiments/all`);
  }

  getPaymentsByCredit(id_credit: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/paiments/credit/${id_credit}`);
  }

  getPaymentsByUser(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/paiments/utilisateur/${id_utilisateur}`);
  }

  getPaymentStats(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/payment-stats/${id_utilisateur}`);
  }

  getRecentPayments(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/recent-payments/${id_utilisateur}`);
  }

  getPaymentByReference(reference: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/paiments/reference/${reference}`);
  }

  // ==================== TRANSACTIONS ====================
  createTransaction(transactionData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/transactions/create`, transactionData);
  }

  getAllTransactions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/transactions/all`);
  }

  getTransactionsByUser(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/transactions/utilisateur/${id_utilisateur}`);
  }

  getTransactionStats(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/transaction-stats/${id_utilisateur}`);
  }

  getRecentTransactions(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/recent-transactions/${id_utilisateur}`);
  }

  // ==================== DASHBOARD CLIENT ====================
  getClientDashboard(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/client/${id_utilisateur}`);
  }
  getGerantDashboard(filter?: any): Observable<any> {
    // Convertir les filtres en paramètres HTTP
    let params = new HttpParams();
    
    if (filter) {
      params = params.append('filter', JSON.stringify(filter));
    }
  
    return this.http.get(`${this.baseUrl}/dashboard/gerant`, { params });
  }
  // ==================== UTILISATEURS ====================

  getUserById(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${id_utilisateur}`);
  }
}