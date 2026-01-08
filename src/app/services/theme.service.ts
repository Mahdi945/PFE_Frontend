import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {
    this.loadTheme();
  }

  // Charger le thème sauvegardé dans le localStorage (s'il y en a)
  loadTheme(): void {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  // Bascule du thème
  toggleTheme(): void {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    }

    // Pour afficher dans la console quel thème est appliqué
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    console.log(`🔄 Thème appliqué : ${currentTheme}`);
  }
}
