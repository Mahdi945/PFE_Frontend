import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  // Détecter si on est sur mobile et définir l'état initial en conséquence
  private isMobile = window.innerWidth <= 768;
  private sidebarVisible = new BehaviorSubject<boolean>(!this.isMobile); // Fermé sur mobile, ouvert sur desktop

  sidebarState$ = this.sidebarVisible.asObservable();

  constructor() {
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  toggleSidebar(): void {
    this.sidebarVisible.next(!this.sidebarVisible.value);
  }

  closeSidebar(): void {
    this.sidebarVisible.next(false);
  }

  openSidebar(): void {
    this.sidebarVisible.next(true);
  }

  checkIsMobile(): boolean {
    return window.innerWidth <= 768;
  }
}
