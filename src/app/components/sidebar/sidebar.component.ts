import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

interface MenuItem {
  element_name: string;
  icon: string;
  routerLink: string;
  is_visible: number;
  children?: MenuItem[];
  isCollapsed?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  isSidebarVisible: boolean = true;
  userRole: string = '';
  user: any = {};
  profilePhoto: string | null = null;
  menuItems: MenuItem[] = [];
  permissions: any[] = [];

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.sidebarService.sidebarState$.subscribe(state => {
      this.isSidebarVisible = state;
      // Ajouter/supprimer la classe sur le body pour ajuster le layout
      if (state) {
        document.body.classList.remove('sidebar-closed');
      } else {
        document.body.classList.add('sidebar-closed');
      }
    });

    this.authService.getProfile().subscribe({
      next: data => {
        this.user = Array.isArray(data) ? data[0][0] || data[0] : data;
        this.userRole = this.user.role;
        this.profilePhoto = this.user.photo
          ? environment.apiUrl + this.user.photo
          : null;
        this.loadPermissions();
      },
      error: err => {
        console.error('Profile load error:', err);
      },
    });
  }

  loadPermissions(): void {
    this.authService.getPermissionsByRole(this.userRole).subscribe({
      next: permissions => {
        this.permissions = permissions || [];
        this.buildMenuItems();
      },
      error: err => {
        console.error('Permissions load error:', err);
      },
    });
  }

  buildMenuItems(): void {
    // Dashboard est toujours présent
    this.menuItems = [
      {
        element_name: 'Dashboard',
        icon: 'bi-grid',
        routerLink: `/dashboard-${this.userRole}`,
        is_visible: 1,
        children: [],
        isCollapsed: true,
      },
    ];

    // Récupérer les éléments parents visibles
    const parentItems = this.permissions.filter(
      p => !p.parent_element && p.is_visible === 1 && p.element_name !== 'Dashboard'
    );

    parentItems.forEach(parent => {
      const menuItem: MenuItem = {
        element_name: parent.element_name,
        icon: this.getIconForElement(parent.element_name),
        routerLink: this.getRouterLinkForElement(parent.element_name),
        is_visible: parent.is_visible,
        children: [],
        isCollapsed: true,
      };

      // Récupérer les sous-éléments visibles
      const childItems = this.permissions.filter(
        p => p.parent_element === parent.element_name && p.is_visible === 1
      );

      childItems.forEach(child => {
        menuItem.children?.push({
          element_name: child.element_name,
          icon: this.getIconForElement(child.element_name),
          routerLink: this.getRouterLinkForElement(
            child.element_name,
            parent.element_name
          ),
          is_visible: child.is_visible,
        });
      });

      this.menuItems.push(menuItem);
    });
  }

  toggleCollapse(menuItem: MenuItem): void {
    menuItem.isCollapsed = !menuItem.isCollapsed;
  }

  getIconForElement(elementName: string): string {
    const icons: { [key: string]: string } = {
      Utilisateurs: 'bi-people',
      'Affecter pompistes': 'bi-calendar-check',
      Crédits: 'bi-credit-card',
      Pompes: 'bi-fuel-pump',
      Stock: 'bi-box-seam',
      'Historique transactions': 'bi-clock-history',
      'Saisie vente credit': 'bi-cash-stack',
      'Saisie Index fermeture': 'bi-speedometer2',
      'Créer compte': 'bi-person-plus',
      'Liste utilisateurs': 'bi-list-ul',
      'Enregistrer crédit': 'bi-plus-circle',
      'Enregistrer Véhicules': 'bi-car-front',
      'Historique des Paiements': 'bi-receipt',
      'Historique des Transactions': 'bi-clock-history',
      'Enregistrer pompe': 'bi-plus-circle',
      'Liste pompes': 'bi-list-ul',
      'Saisie Paiements': 'bi-cash-stack',
      'Visualiser Revenues': 'bi-receipt',
      'Gérer le Stock': 'bi-cart-check',
      Réclamer: 'bi-receipt',
      'Traiter les réclamations': 'bi-headset',
      'Point de vente': 'bi-cart-check',
    };
    return icons[elementName] || 'bi-circle';
  }

  getRouterLinkForElement(elementName: string, parentElement?: string): string {
    const routes: { [key: string]: string } = {
      Dashboard: `/dashboard-${this.userRole}`,
      Utilisateurs: '/gestion-utilisateurs',
      'Affecter pompistes': '/gestion-affectations-pompistes',
      Crédits: '/gestion-credits',
      Pompes: '/liste-pompes',
      Stock: '/gestion-stock',
      'Gérer le Stock': '/gestion-stock',
      'Historique transactions': '/gestion-transactions',
      'Saisie vente credit': '/saisie-credit',
      'Saisie Index fermeture': '/saisie-index',
      'Créer compte': '/ajouter-utilisateur',
      'Liste utilisateurs': '/gestion-utilisateurs',
      'Enregistrer crédit': '/gestion-credits',
      'Enregistrer Véhicules': '/gestion-vehicules',
      'Historique des Paiements': '/liste-paiements',
      'Historique des Transactions': '/gestion-transactions',
      'Enregistrer pompe': '/ajouter-pompe',
      'Liste pompes': '/liste-pompes',
      'Saisie Paiements': '/saisie-paiement',
      Réclamer: '/envoyer-reclamation',
      'Visualiser Revenues': '/visualiser-revenues',
      'Traiter les réclamations': '/traiter-reclamations',
      'Point de vente': '/ajouter-vente',
    };
    return routes[elementName] || '#';
  }

  hasVisibleChildren(item: MenuItem): boolean {
    return !!item.children && item.children.length > 0;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.style.display = 'none';
    // Show placeholder instead
    const parent = target.parentElement;
    if (parent) {
      const placeholder = parent.querySelector('.avatar-placeholder');
      if (placeholder) {
        (placeholder as HTMLElement).style.display = 'flex';
      }
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Redirection handled in AuthService
      },
      error: (err) => {
        console.error('Logout error:', err);
      }
    });
  }
}
