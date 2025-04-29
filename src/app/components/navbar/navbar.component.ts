// navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';
import { SidebarService } from '../../services/sidebar.service';
import { ThemeService } from '../../services/theme.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  user: any = {};
  profilePhoto: string | null = null;
  isDarkMode = false;
  notifications: any[] = [];
  unreadCount = 0;
  showAllNotificationsModal = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService,
    public themeService: ThemeService,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    
    this.notificationsService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(n => !n.vue).length;
    });
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = !this.isDarkMode;
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: (data) => {
        if (Array.isArray(data) && data[0] && data[0][0]) {
          this.user = data[0][0];
          this.profilePhoto = this.user.photo ? 'http://localhost:3000' + this.user.photo : null;
          this.loadNotifications();
        }
      },
      error: (err) => console.error("Erreur lors du chargement du profil:", err)
    });
  }

  loadNotifications(): void {
    if (this.user?.id) {
      this.notificationsService.getNotifications(this.user.id).subscribe({
        next: (notifs) => {
          this.notifications = notifs;
          this.unreadCount = notifs.filter(n => !n.vue).length;
        },
        error: (err) => console.error('Erreur chargement notifications:', err)
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
      error: (err) => console.error('Erreur marquage comme lu:', err)
    });
  }

  markAllAsRead(): void {
    const unreadIds = this.notifications.filter(n => !n.vue).map(n => n.id);
    if (unreadIds.length === 0) return;

    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.vue = 1);
        this.unreadCount = 0;
      },
      error: (err) => console.error('Erreur marquage tout comme lu:', err)
    });
  }

  getNotificationIcon(type: string): string {
    switch(type) {
      case 'paiement_reussi': return 'bi-currency-exchange text-success';
      case 'remboursement': return 'bi-arrow-return-left text-info';
      case 'transaction_reussie': return 'bi-check-circle text-success';
      case 'expiration': return 'bi-exclamation-triangle text-danger';
      case 'expiration_proche': return 'bi-clock-history text-warning';
      case 'systeme': return 'bi-gear text-secondary';
      case 'autre': return 'bi-info-circle text-primary';
      default: return 'bi-bell text-primary';
    }
  }

  getNotificationTitle(type: string): string {
    switch(type) {
      case 'paiement_reussi': return 'Paiement réussi';
      case 'remboursement': return 'Remboursement';
      case 'transaction_reussie': return 'Transaction réussie';
      case 'expiration': return 'Expiration';
      case 'expiration_proche': return 'Expiration proche';
      case 'systeme': return 'Système';
      case 'autre': return 'Notification';
      default: return 'Notification';
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
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => console.error("Erreur lors de la déconnexion:", err)
    });
  }
}