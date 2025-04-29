// services/notifications.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, startWith, tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private baseUrl = 'http://localhost:3000/api/notifications';
  private notificationsSubject = new BehaviorSubject<any[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private currentUserId: number | null = null;

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Auto-refresh toutes les 5 minutes
    interval(300000).pipe(
      startWith(0),
      switchMap(() => this.refreshNotifications())
    ).subscribe();
  }

  private refreshNotifications(): Observable<any> {
    if (!this.currentUserId) return new Observable();
    
    return this.getUnreadCount(this.currentUserId).pipe(
      tap(count => this.unreadCountSubject.next(count)),
      switchMap(() => this.getNotifications(this.currentUserId!))
    );
  }

  loadInitialData(userId: number): void {
    this.currentUserId = userId;
    this.refreshNotifications().subscribe();
  }

// services/notifications.service.ts
getNotifications(userId: number): Observable<any[]> {
  return this.http.get<any>(`${this.baseUrl}/${userId}`).pipe(
    map(response => response.data || []), // Extraction du tableau de données
    tap(notifications => this.notificationsSubject.next(notifications))
  );
}

getUnreadCount(userId: number): Observable<number> {
  return this.http.get<any>(`${this.baseUrl}/unread-count/${userId}`).pipe(
    map(response => response.count || 0) // Extraction du count
  );
}

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/mark-as-read`, { id }).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(notif => 
          notif.id === id ? {...notif, vue: true} : notif
        );
        this.notificationsSubject.next(updatedNotifications);
        
        const currentUnread = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, currentUnread - 1));
      })
    );
  }

  markAllAsRead(): Observable<any> {
    if (!this.currentUserId) return new Observable();
    return this.http.put(`${this.baseUrl}/mark-all-as-read`, { id_utilisateur: this.currentUserId }).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(notif => ({
          ...notif,
          vue: true
        }));
        this.notificationsSubject.next(updatedNotifications);
        this.unreadCountSubject.next(0);
      })
    );
  }
}