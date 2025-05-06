import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GestionCreditsService {
  private baseUrl = 'http://localhost:3000/api/Credit';
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // ==================== CRÉDITS ====================
  addCredit(creditData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/credits/add`, creditData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  updateCredit(creditData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/credits/update`, creditData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getAllCredits(): Observable<any> {
    return this.http.get(`${this.baseUrl}/credits/all`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getCreditById(id_credit: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/credits/${id_credit}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getCreditsByUser(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/credits/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getCreditStats(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/credit-stats/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  updateCreditState(creditStateData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/credits/state`, creditStateData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  deleteCredit(id_credit: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/credits/${id_credit}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  renewCredit(creditData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/credits/renew`, creditData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // ==================== VÉHICULES ====================
  addVehicule(vehiculeData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/vehicules/add`, vehiculeData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getVehiculeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getVehiculesByClient(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules/client/${username}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getVehiculesByCredit(id_credit: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules/credit/${id_credit}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getAllVehicules(): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getVehiculeByImmatriculation(immatriculation: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicules/immatriculation/${immatriculation}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  updateVehicule(vehiculeData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/vehicules/update`, vehiculeData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  deleteVehicule(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/vehicules/${id}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // ==================== PAIEMENTS ====================
  createPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/paiments/create`, paymentData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getAllPayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/paiments/all`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getPaymentsByCredit(id_credit: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/paiments/credit/${id_credit}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getPaymentsByUser(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/paiments/utilisateur/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getPaymentStats(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/payment-stats/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getRecentPayments(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/recent-payments/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getPaymentByReference(reference: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/paiments/reference/${reference}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // ==================== TRANSACTIONS ====================
  createTransaction(transactionData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/transactions/create`, transactionData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getAllTransactions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/transactions/all`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getTransactionsByUser(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/transactions/utilisateur/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getTransactionStats(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/transaction-stats/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getRecentTransactions(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/recent-transactions/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // ==================== DASHBOARD ====================
  getClientDashboard(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/client/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getGerantDashboard(filter?: any): Observable<any> {
    let params = new HttpParams();
    if (filter) {
      params = params.append('filter', JSON.stringify(filter));
    }
    return this.http.get(`${this.baseUrl}/dashboard/gerant`, {
      params,
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // ==================== UTILISATEURS ====================
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  getUserById(id_utilisateur: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${id_utilisateur}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }
}