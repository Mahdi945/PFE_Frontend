import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';
import { SidebarService } from '../../services/sidebar.service';
import { ThemeService } from '../../services/theme.service';
import { SearchService } from '../../services/search.service';
import { MessageService } from '../../services/messages.service';
import { UserService } from '../../services/user.service';
import { WebSocketService } from '../../services/websocket.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';

interface AppUser {
  id: string;
  username: string;
  email?: string;
  role?: string;
  numero_telephone?: string;
  photo?: string;
  status?: string;
  unreadCount?: number;
  lastMessage?: string;
  contact_id?: string;
  last_message_time?: string;
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

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, DatePipe],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  user: AppUser = {} as AppUser;
  profilePhoto: string | null = null;
  isDarkMode = false;
  apiUrl = environment.apiUrl;
  notifications: any[] = [];
  unreadCount = 0;
  showAllNotificationsModal = false;
  searchQuery: string = '';
  searchResults: any[] = [];
  showSearchResults: boolean = false;
  isMessageModalOpen = false;

  // Propriétés pour la messagerie
  unreadMessagesCount = 0;
  allUsers: AppUser[] = [];
  filteredUsers: AppUser[] = [];
  selectedContact: AppUser | null = null;
  messages: Message[] = [];
  newMessage = '';
  contactSearch = '';
  currentUserId = '';
  isLoadingMessages = false;
  isLoadingContacts = false;

  // Getter pour exposer l'état WebSocket dans le template
  get webSocketConnected(): boolean {
    return this.wsConnected;
  }

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  private messagesSub!: Subscription;
  private contactsSub!: Subscription;
  private unreadCountSub!: Subscription;
  private wsConnectionSub!: Subscription;
  private wsConnected = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService,
    public themeService: ThemeService,
    private notificationsService: NotificationsService,
    private searchService: SearchService,
    private messageService: MessageService,
    private userService: UserService,
    private webSocketService: WebSocketService
  ) {}
  ngOnInit(): void {
    this.loadUserProfile();
    this.isDarkMode = localStorage.getItem('theme') === 'dark';

    this.notificationsService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(n => !n.vue).length;
    });

    // Surveiller l'état de connexion WebSocket
    this.wsConnectionSub = this.webSocketService
      .getConnectionStatus()
      .subscribe(connected => {
        this.wsConnected = connected;
        if (connected) {
          console.log('✅ WebSocket connected in navbar');
        } else {
          console.log('❌ WebSocket disconnected in navbar');
        }
      });
  }

  ngOnDestroy(): void {
    this.messagesSub?.unsubscribe();
    this.contactsSub?.unsubscribe();
    this.unreadCountSub?.unsubscribe();
    this.wsConnectionSub?.unsubscribe();

    // Déconnecter WebSocket lors de la destruction du composant
    this.webSocketService.disconnect();
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: data => {
        if (Array.isArray(data) && data[0] && data[0][0]) {
          this.user = data[0][0];
          this.currentUserId = this.user.id;
          this.profilePhoto = this.user.photo
            ? environment.apiUrl + this.user.photo
            : '/assets/default-profile.png';
          this.loadNotifications();
          this.messageService.setCurrentUser(this.currentUserId);
          this.setupMessageSubscriptions();
        }
      },
      error: err => console.error('Erreur lors du chargement du profil:', err),
    });
  }
  private setupMessageSubscriptions(): void {
    this.contactsSub = this.messageService.contacts$.subscribe(contacts => {
      this.allUsers = contacts;
      this.filteredUsers = [...this.allUsers];
      this.isLoadingContacts = false;
    });

    this.messagesSub = this.messageService.messages$.subscribe(messages => {
      this.messages = messages;
      // Scroll automatique après mise à jour des messages
      setTimeout(() => this.scrollToBottom(), 50);
    });

    this.unreadCountSub = this.messageService.unreadCount$.subscribe(count => {
      this.unreadMessagesCount = count;
    });
  }

  filterContacts(): void {
    if (!this.contactSearch) {
      this.filteredUsers = [...this.allUsers];
      return;
    }

    const searchTerm = this.contactSearch.toLowerCase();
    this.filteredUsers = this.allUsers.filter(
      user =>
        (user.username && user.username.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.role && user.role.toLowerCase().includes(searchTerm)) ||
        (user.numero_telephone && user.numero_telephone.includes(this.contactSearch))
    );
  }

  openMessages(): void {
    this.isMessageModalOpen = true;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('messageModal')
    );
    modal.show();
    this.isLoadingContacts = true;

    // Écouter la fermeture du modal
    document.getElementById('messageModal')?.addEventListener(
      'hidden.bs.modal',
      () => {
        this.isMessageModalOpen = false;
        this.selectedContact = null;
        this.messages = [];
      },
      { once: true }
    );
  }

  selectContact(contact: AppUser, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.selectedContact = contact;
    this.isLoadingMessages = true;

    this.messageService.getConversation(this.currentUserId, contact.id).subscribe({
      next: () => {
        this.isLoadingMessages = false;

        if (contact.unreadCount && contact.unreadCount > 0) {
          this.messageService.markAsRead(contact.id, this.currentUserId).subscribe();
        }
      },
      error: err => {
        console.error('Erreur chargement conversation:', err);
        this.isLoadingMessages = false;
      },
    });
  }

  openMessagesWithContact(contact: AppUser): void {
    this.openMessages();
    setTimeout(() => this.selectContact(contact), 100);
  }
  sendMessage(): void {
    if (this.newMessage.trim() && this.selectedContact) {
      const messageContent = this.newMessage;
      this.newMessage = '';

      // Envoyer via le service (qui gère déjà l'ajout temporaire)
      this.messageService
        .sendMessage(this.currentUserId, this.selectedContact.id, messageContent)
        .subscribe({
          next: response => {
            console.log('✅ Message envoyé via:', response.method || 'HTTP');
            this.scrollToBottom();
          },
          error: err => {
            console.error('❌ Erreur envoi message:', err);
            // Le service gère déjà la suppression du message temporaire en cas d'erreur
          },
        });
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  // ================ RECHERCHE ================
  async onSearchInput(): Promise<void> {
    if (this.searchQuery.length > 1) {
      this.searchResults = await this.searchService.search(this.searchQuery);
      this.showSearchResults = true;
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
    }
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();
    if (this.searchResults.length > 0) {
      this.navigateToResult(this.searchResults[0]);
    }
  }

  focusSearch(): void {
    this.searchInput.nativeElement.focus();
    this.showSearchResults = this.searchResults.length > 0;
  }

  navigateToResult(result: any): void {
    this.showSearchResults = false;
    this.searchQuery = '';

    if (result.path === '/logout') {
      this.logout();
    } else {
      this.router.navigate([result.path]);
    }
  }

  // ================ AUTRES FONCTIONNALITÉS ================
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-bar')) {
      this.showSearchResults = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = !this.isDarkMode;
  }

  loadNotifications(): void {
    if (this.user?.id) {
      this.notificationsService.getNotifications(Number(this.user.id)).subscribe({
        next: notifs => {
          this.notifications = notifs;
          this.unreadCount = notifs.filter(n => !n.vue).length;
        },
        error: err => console.error('Erreur chargement notifications:', err),
      });
    }
  }

  markAsRead(id: number): void {
    this.notificationsService.markNotificationAsRead(id).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.vue = 1;
        this.unreadCount = this.notifications.filter(n => !n.vue).length;
      },
      error: err => console.error('Erreur marquage comme lu:', err),
    });
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => (n.vue = 1));
        this.unreadCount = 0;
      },
      error: err => console.error('Erreur marquage tout comme lu:', err),
    });
  }

  hideNotification(id: number): void {
    this.notificationsService.hideNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.unreadCount = this.notifications.filter(n => !n.vue).length;
      },
      error: err => console.error('Erreur suppression notification:', err),
    });
  }

  hideAllNotifications(): void {
    this.notificationsService.hideAllNotifications().subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
      },
      error: err => console.error('Erreur suppression notifications:', err),
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'paiement_reussi':
        return 'bi-currency-exchange text-success';
      case 'remboursement':
        return 'bi-arrow-return-left text-info';
      case 'transaction_reussie':
        return 'bi-check-circle text-success';
      case 'expiration':
        return 'bi-exclamation-triangle text-danger';
      case 'expiration_proche':
        return 'bi-clock-history text-warning';
      case 'systeme':
        return 'bi-gear text-secondary';
      case 'autre':
        return 'bi-info-circle text-primary';
      case 'reclamation_created':
        return 'bi-plus-circle text-primary';
      case 'reclamation_updated':
        return 'bi-pencil-square text-warning';
      case 'reclamation_resolved':
        return 'bi-check-circle-fill text-success';
      case 'reclamation_closed':
        return 'bi-lock-fill text-secondary';
      default:
        return 'bi-bell text-primary';
    }
  }

  getNotificationTitle(type: string): string {
    switch (type) {
      case 'paiement_reussi':
        return 'Paiement réussi';
      case 'remboursement':
        return 'Remboursement';
      case 'transaction_reussie':
        return 'Transaction réussie';
      case 'expiration':
        return 'Expiration';
      case 'expiration_proche':
        return 'Expiration proche';
      case 'systeme':
        return 'Système';
      case 'autre':
        return 'Notification';
      default:
        return 'Notification';
    }
  }

  openAllNotificationsModal(): void {
    this.showAllNotificationsModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAllNotificationsModal(): void {
    this.showAllNotificationsModal = false;
    document.body.style.overflow = '';
  }
  logout(): void {
    // Déconnecter WebSocket et nettoyer les services de messages
    this.messageService.disconnect();

    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => console.error('Erreur lors de la déconnexion:', err),
    });
  }
}
