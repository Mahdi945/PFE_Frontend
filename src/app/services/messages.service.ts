import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, Subscription } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private apiUrl = `${environment.apiUrl}/api/messages`;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private contactsSubject = new BehaviorSubject<AppUser[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private currentUserId: string | null = null;
  private wsSubscriptions: Subscription[] = [];

  messages$ = this.messagesSubject.asObservable();
  contacts$ = this.contactsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService
  ) {
    this.initializeWebSocketListeners();
  }
  private getAuthHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }
  private initializeWebSocketListeners(): void {
    // Écouter les nouveaux messages
    const newMessageSub = this.webSocketService.newMessage$.subscribe(message => {
      if (message && this.currentUserId) {
        console.log('📨 Nouveau message reçu:', message);

        // Vérifier si le message concerne l'utilisateur actuel
        if (
          message.sender_id === this.currentUserId ||
          message.receiver_id === this.currentUserId
        ) {
          // Mettre à jour les messages si on visualise cette conversation
          const currentMessages = this.messagesSubject.value;

          // Éviter les doublons - vérifier si le message n'existe pas déjà
          const messageExists = currentMessages.some(
            msg =>
              msg.id === message.id ||
              (msg.content === message.content &&
                msg.sender_id === message.sender_id &&
                msg.receiver_id === message.receiver_id &&
                Math.abs(
                  new Date(msg.created_at).getTime() -
                    new Date(message.created_at).getTime()
                ) < 5000)
          );

          if (!messageExists) {
            // Le message vient déjà au bon format depuis le serveur
            const formattedMessage: Message = {
              id: message.id,
              sender_id: message.sender_id,
              receiver_id: message.receiver_id,
              content: message.content,
              is_read: message.is_read || false,
              created_at: message.created_at,
              sender_name: message.sender_name || '',
              sender_photo: message.sender_photo || '',
              receiver_name: message.receiver_name || '',
              receiver_photo: message.receiver_photo || '',
            };

            // Supprimer les messages temporaires avec le même contenu
            const filteredMessages = currentMessages.filter(
              msg =>
                !(
                  msg.id === 0 &&
                  msg.content === message.content &&
                  msg.sender_id === message.sender_id &&
                  msg.receiver_id === message.receiver_id
                )
            );

            this.messagesSubject.next([...filteredMessages, formattedMessage]);
            console.log('✅ Message ajouté à la liste:', formattedMessage);
          } else {
            console.log('⚠️ Message déjà existant, ignoré');
          }

          // Rafraîchir les contacts et le compteur
          this.refreshContacts();
          this.refreshUnreadCount();
        }
      }
    }); // Écouter les confirmations de messages
    const messageConfirmedSub = this.webSocketService.messageConfirmed$.subscribe(
      message => {
        if (message) {
          console.log('✅ Message confirmé reçu:', message);
          // Mettre à jour le message dans la liste (remplacer le temporaire par le réel)
          const currentMessages = this.messagesSubject.value;
          const updatedMessages = currentMessages.map(msg => {
            // Identifier le message temporaire par son contenu et les IDs
            if (
              msg.id === 0 &&
              msg.content === message.content &&
              msg.sender_id === message.sender_id &&
              msg.receiver_id === message.receiver_id
            ) {
              // Remplacer le message temporaire par le message confirmé
              return {
                id: message.id,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                content: message.content,
                is_read: message.is_read || false,
                created_at: message.created_at,
                sender_name: message.sender_name || '',
                sender_photo: message.sender_photo || '',
                receiver_name: message.receiver_name || '',
                receiver_photo: message.receiver_photo || '',
              };
            }
            return msg;
          });
          this.messagesSubject.next(updatedMessages);
          console.log('✅ Message temporaire remplacé par message confirmé');

          // Rafraîchir les contacts pour mettre à jour les infos de derniers messages
          this.refreshContacts();
        }
      }
    );

    // Écouter les mises à jour de compteur
    const unreadCountSub = this.webSocketService.unreadCountUpdate$.subscribe(
      data => {
        if (data && data.userId === this.currentUserId) {
          this.unreadCountSubject.next(data.count);
        }
      }
    ); // Écouter les erreurs de messages
    const messageErrorSub = this.webSocketService.messageError$.subscribe(error => {
      if (error) {
        console.error('❌ WebSocket message error:', error);

        // Supprimer les messages temporaires en cas d'erreur
        const currentMessages = this.messagesSubject.value;
        const filteredMessages = currentMessages.filter(msg => msg.id !== 0);
        this.messagesSubject.next(filteredMessages);

        // Vous pouvez ajouter une notification toast ici
      }
    });

    this.wsSubscriptions.push(
      newMessageSub,
      messageConfirmedSub,
      unreadCountSub,
      messageErrorSub
    );
  }

  private refreshContacts(): void {
    if (this.currentUserId) {
      this.getAllContacts(this.currentUserId).subscribe();
    }
  }

  private refreshUnreadCount(): void {
    if (this.currentUserId) {
      this.getUnreadCount(this.currentUserId).subscribe(response => {
        this.unreadCountSubject.next(response.count);
      });
    }
  }
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;

    // Connecter WebSocket avec l'ID utilisateur
    this.webSocketService.connect(userId);

    // Charger les données initiales
    this.refreshContacts();
    this.refreshUnreadCount();
  }
  sendMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Observable<any> {
    // Envoyer via WebSocket si connecté, sinon fallback HTTP
    if (this.webSocketService.isConnected()) {
      console.log('📤 Envoi via WebSocket:', { senderId, receiverId, content });

      // Ajouter temporairement le message à l'interface
      const tempMessage: Message = {
        id: 0, // ID temporaire
        sender_id: senderId,
        receiver_id: receiverId,
        content: content,
        is_read: false,
        created_at: new Date().toISOString(),
        sender_name: '',
        sender_photo: '',
      };

      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, tempMessage]);

      // Envoyer via WebSocket
      this.webSocketService.sendMessage(senderId, receiverId, content);

      return of({ success: true, method: 'websocket' });
    } else {
      console.log('📤 Envoi via HTTP (fallback):', {
        senderId,
        receiverId,
        content,
      });
      // Fallback HTTP
      return this.http
        .post(
          this.apiUrl,
          { senderId, receiverId, content },
          {
            headers: this.getAuthHeaders(),
            withCredentials: true,
          }
        )
        .pipe(
          tap(response => {
            console.log('✅ Message HTTP envoyé:', response);
            this.refreshContacts();
            this.refreshUnreadCount();
          }),
          catchError(error => {
            console.error('❌ Erreur envoi HTTP:', error);
            throw error;
          })
        );
    }
  }

  getConversation(user1: string, user2: string): Observable<Message[]> {
    return this.http
      .get<Message[]>(`${this.apiUrl}/conversation/${user1}/${user2}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        tap(messages => {
          // Mettre à jour le sujet des messages
          this.messagesSubject.next(messages);
        })
      );
  }

  getUserMessages(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`, {
      headers: this.getAuthHeaders(),
      withCredentials: true,
    });
  }

  getUnreadCount(userId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.apiUrl}/unread-count/${userId}`,
      {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      }
    );
  }
  markAsRead(senderId: string, receiverId: string): Observable<any> {
    // Envoyer via WebSocket si connecté, sinon fallback HTTP
    if (this.webSocketService.isConnected()) {
      this.webSocketService.markAsRead(senderId, receiverId);
      return of({ success: true, method: 'websocket' });
    } else {
      // Fallback HTTP
      return this.http
        .put(
          `${this.apiUrl}/mark-as-read`,
          { senderId, receiverId },
          {
            headers: this.getAuthHeaders(),
            withCredentials: true,
          }
        )
        .pipe(
          tap(() => {
            this.refreshUnreadCount();
          })
        );
    }
  }

  disconnect(): void {
    // Déconnecter WebSocket
    this.webSocketService.disconnect();

    // Nettoyer les subscriptions
    this.wsSubscriptions.forEach(sub => sub.unsubscribe());
    this.wsSubscriptions = [];

    // Réinitialiser les données
    this.currentUserId = null;
    this.messagesSubject.next([]);
    this.contactsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  getAllContacts(userId: string): Observable<AppUser[]> {
    return this.http
      .get<AppUser[]>(`${this.apiUrl}/contacts/${userId}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        tap(contacts => {
          // Trier les contacts: ceux avec des messages non lus d'abord, puis par date de dernier message
          const sortedContacts = [...contacts].sort((a, b) => {
            if (a.unreadCount && !b.unreadCount) return -1;
            if (!a.unreadCount && b.unreadCount) return 1;
            if (a.lastMessageTime && b.lastMessageTime) {
              return (
                new Date(b.lastMessageTime).getTime() -
                new Date(a.lastMessageTime).getTime()
              );
            }
            return 0;
          });
          this.contactsSubject.next(sortedContacts);
        })
      );
  }
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_photo?: string;
  receiver_name?: string;
  receiver_photo?: string;
}

interface AppUser {
  id: string;
  username: string;
  email?: string;
  role?: string;
  photo?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}
