import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket | undefined;
  private serverUrl = environment.apiUrl;

  // Subjects pour les événements
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private newMessageSubject = new BehaviorSubject<any>(null);
  private messageConfirmedSubject = new BehaviorSubject<any>(null);
  private unreadCountUpdateSubject = new BehaviorSubject<any>(null);
  private messageErrorSubject = new BehaviorSubject<any>(null);

  // Observables publiques
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public newMessage$ = this.newMessageSubject.asObservable();
  public messageConfirmed$ = this.messageConfirmedSubject.asObservable();
  public unreadCountUpdate$ = this.unreadCountUpdateSubject.asObservable();
  public messageError$ = this.messageErrorSubject.asObservable();

  constructor() {}

  connect(userId: string): void {
    if (this.socket && this.socket.connected) {
      return; // Déjà connecté
    }

    this.socket = io(this.serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server:', this.socket?.id);
      this.connectionStatusSubject.next(true);

      // Joindre avec l'ID utilisateur
      this.socket?.emit('join', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      this.connectionStatusSubject.next(false);
    });

    this.socket.on('connect_error', error => {
      console.error('❌ WebSocket connection error:', error);
      this.connectionStatusSubject.next(false);
    }); // Événements de messages
    this.socket.on('newMessage', message => {
      console.log('📨 New message received via WebSocket:', message);
      this.newMessageSubject.next(message);
    });

    this.socket.on('messageConfirmed', message => {
      console.log('✅ Message confirmed via WebSocket:', message);
      this.messageConfirmedSubject.next(message);
    });

    this.socket.on('unreadCountUpdate', data => {
      console.log('📊 Unread count update:', data);
      this.unreadCountUpdateSubject.next(data);
    });

    this.socket.on('messageError', error => {
      console.error('❌ Message error:', error);
      this.messageErrorSubject.next(error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
      this.connectionStatusSubject.next(false);
    }
  }
  sendMessage(senderId: string, receiverId: string, content: string): void {
    if (this.socket && this.socket.connected) {
      console.log('📤 Envoi du message via WebSocket:', {
        senderId,
        receiverId,
        content,
      });
      this.socket.emit('sendMessage', {
        senderId,
        receiverId,
        content,
      });
    } else {
      console.error('❌ WebSocket not connected. Cannot send message.');
      this.messageErrorSubject.next({ error: 'WebSocket not connected' });
    }
  }

  markAsRead(senderId: string, receiverId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('markAsRead', {
        senderId,
        receiverId,
      });
    } else {
      console.error('❌ WebSocket not connected. Cannot mark as read.');
    }
  }

  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$;
  }
}
