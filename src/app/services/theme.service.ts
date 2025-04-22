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
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  // Bascule du thème
  toggleTheme(): void {
    if (document.body.classList.contains('dark')) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }

    // Pour afficher dans la console quel thème est appliqué
    const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
    console.log(`🔄 Thème appliqué : ${currentTheme}`);
  }
}
