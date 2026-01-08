import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, startWith, tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private baseUrl = `${environment.apiUrl}/api/notifications`;
  private notificationsSubject = new BehaviorSubject<any[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private currentUserId: number | null = null;

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Auto-refresh toutes les 5 minutes
    interval(300000)
      .pipe(
        startWith(0),
        switchMap(() => this.refreshNotifications())
      )
      .subscribe();
  }

  private getAuthHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  private refreshNotifications(): Observable<any> {
    if (!this.currentUserId) return new Observable();

    return this.getUnreadCount(this.currentUserId).pipe(
      tap(count => this.unreadCountSubject.next(count)),
      switchMap(() => this.getNotifications(this.currentUserId!)),
      catchError(error => {
        console.error('Error refreshing notifications:', error);
        return [];
      })
    );
  }

  loadInitialData(userId: number): void {
    this.currentUserId = userId;
    this.refreshNotifications().subscribe();
  }

  getNotifications(userId: number): Observable<any[]> {
    return this.http
      .get<any>(`${this.baseUrl}/${userId}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        map(response => response.data || []),
        tap(notifications => this.notificationsSubject.next(notifications))
      );
  }

  getUnreadCount(userId: number): Observable<number> {
    return this.http
      .get<any>(`${this.baseUrl}/unread-count/${userId}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(map(response => response.count || 0));
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http
      .put(
        `${this.baseUrl}/mark-as-read`,
        { id },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true,
        }
      )
      .pipe(
        tap(() => {
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(notif =>
            notif.id === id ? { ...notif, vue: true } : notif
          );
          this.notificationsSubject.next(updatedNotifications);

          const currentUnread = this.unreadCountSubject.value;
          this.unreadCountSubject.next(Math.max(0, currentUnread - 1));
        })
      );
  }

  markAllAsRead(): Observable<any> {
    if (!this.currentUserId) return new Observable();
    return this.http
      .put(
        `${this.baseUrl}/mark-all-as-read`,
        { id_utilisateur: this.currentUserId },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true,
        }
      )
      .pipe(
        tap(() => {
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(notif => ({
            ...notif,
            vue: true,
          }));
          this.notificationsSubject.next(updatedNotifications);
          this.unreadCountSubject.next(0);
        })
      );
  }
  hideNotification(id: number): Observable<any> {
    if (!this.currentUserId) return new Observable();
    return this.http
      .delete(`${this.baseUrl}/hide`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
        body: { id, id_utilisateur: this.currentUserId },
      })
      .pipe(
        tap(() => {
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.filter(
            notif => notif.id !== id
          );
          this.notificationsSubject.next(updatedNotifications);

          const currentUnread = this.unreadCountSubject.value;
          const wasUnread = currentNotifications.find(n => n.id === id)?.vue === 0;
          this.unreadCountSubject.next(
            wasUnread ? Math.max(0, currentUnread - 1) : currentUnread
          );
        })
      );
  }

  hideAllNotifications(): Observable<any> {
    if (!this.currentUserId) return new Observable();
    return this.http
      .delete(`${this.baseUrl}/hide-all`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
        body: { id_utilisateur: this.currentUserId },
      })
      .pipe(
        tap(() => {
          this.notificationsSubject.next([]);
          this.unreadCountSubject.next(0);
        })
      );
  }
}
