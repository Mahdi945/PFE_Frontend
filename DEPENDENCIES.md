# 📦 Documentation des Dépendances

Ce fichier explique le rôle et l'utilité de chaque bibliothèque utilisée dans le projet PFE Frontend.

## 🎯 Dépendances de Production (dependencies)

### Framework Angular Core
- **@angular/animations** `^18.0.0` - Module d'animations Angular pour créer des transitions et effets visuels
- **@angular/cdk** `^18.2.14` - Component Development Kit, outils de base pour construire des composants Angular
- **@angular/common** `^18.0.0` - Services et directives communes d'Angular (pipes, directives structurelles)
- **@angular/compiler** `^18.0.0` - Compilateur Angular pour transformer le code TypeScript en JavaScript
- **@angular/core** `^18.0.0` - Cœur du framework Angular avec les fonctionnalités essentielles
- **@angular/forms** `^18.0.0` - Module pour la gestion des formulaires (reactive forms, template-driven forms)
- **@angular/material** `^18.2.14` - Bibliothèque de composants UI Material Design pour Angular
- **@angular/platform-browser** `^18.0.0` - Adaptateur pour exécuter Angular dans le navigateur
- **@angular/platform-browser-dynamic** `^18.0.0` - Compilation dynamique pour le navigateur
- **@angular/router** `^18.0.0` - Module de routage pour la navigation entre les pages

### Calendrier et Planning
- **@fullcalendar/angular** `^6.1.17` - Intégration Angular pour FullCalendar
- **@fullcalendar/core** `^6.1.17` - Cœur de FullCalendar pour afficher des calendriers interactifs
- **@fullcalendar/daygrid** `^6.1.17` - Vue en grille mensuelle pour FullCalendar
- **@fullcalendar/interaction** `^6.1.17` - Gestion des interactions utilisateur (glisser-déposer, sélection)
- **@fullcalendar/list** `^6.1.17` - Vue en liste pour FullCalendar
- **@fullcalendar/timegrid** `^6.1.17` - Vue en grille horaire (semaine/jour) pour FullCalendar

### UI/UX et Design
- **@primeng/themes** `^18.0.2` - Thèmes pour PrimeNG
- **primeicons** `^7.0.0` - Icônes pour les composants PrimeNG
- **primeng** `^18.0.2` - Bibliothèque complète de composants UI riches (tables, formulaires, dialogues)
- **bootstrap** `^5.3.3` - Framework CSS pour un design responsive et moderne

### Graphiques et Visualisation
- **apexcharts** `^4.5.0` - Bibliothèque de graphiques modernes et interactifs
- **chart.js** `^4.4.8` - Bibliothèque de graphiques simples et flexibles

### QR Code et Code-barres
- **@zxing/ngx-scanner** `^19.0.0` - Scanner de QR codes et codes-barres pour Angular
- **jsbarcode** `^3.11.6` - Génération de codes-barres
- **qrcode** `^1.5.4` - Génération de QR codes

### Export et Fichiers
- **file-saver** `^2.0.5` - Sauvegarde de fichiers côté client
- **html2canvas** `^1.4.1` - Capture d'écran HTML en canvas/image
- **jspdf** `^3.0.1` - Génération de fichiers PDF côté client
- **jspdf-autotable** `^5.0.2` - Plugin pour créer des tableaux dans les PDF
- **xlsx** `^0.18.5` - Lecture et écriture de fichiers Excel

### Notifications et Communication
- **ngx-toastr** `^19.0.0` - Notifications toast élégantes pour Angular
- **socket.io-client** `^4.8.1` - Client WebSocket pour communication temps réel

### Utilitaires
- **date-fns** `^4.1.0` - Bibliothèque moderne pour la manipulation des dates
- **rxjs** `~7.8.0` - Programmation réactive avec des observables
- **tslib** `^2.3.0` - Bibliothèque d'aide pour TypeScript
- **zone.js** `~0.14.3` - Polyfill pour la détection de changements asynchrones

### Types TypeScript (@types)
- **@types/file-saver** `^2.0.7` - Types TypeScript pour file-saver
- **@types/jsbarcode** `^3.11.4` - Types TypeScript pour jsbarcode
- **@types/qrcode** `^1.5.5` - Types TypeScript pour qrcode
- **@types/socket.io-client** `^3.0.0` - Types TypeScript pour socket.io-client

## 🛠️ Dépendances de Développement (devDependencies)

### Build et CLI
- **@angular-devkit/build-angular** `^18.0.7` - Outils de build pour projets Angular
- **@angular/cli** `^18.0.7` - Interface en ligne de commande Angular
- **@angular/compiler-cli** `^18.0.7` - Compilateur Angular pour la ligne de commande

### Tests
- **@types/jasmine** `~5.1.0` - Types TypeScript pour Jasmine
- **jasmine-core** `~5.1.0` - Framework de tests JavaScript
- **karma** `~6.4.0` - Lanceur de tests pour JavaScript
- **karma-chrome-launcher** `~3.2.0` - Plugin Karma pour Chrome
- **karma-coverage** `~2.2.0` - Plugin Karma pour la couverture de code
- **karma-jasmine** `~5.1.0` - Plugin Karma pour Jasmine
- **karma-jasmine-html-reporter** `~2.1.0` - Reporter HTML pour les tests Karma
- **cypress** `^14.1.0` - Framework de tests end-to-end

### Qualité de Code
- **angular-eslint** `19.3.0` - Règles ESLint spécifiques à Angular
- **eslint** `^9.23.0` - Linter JavaScript/TypeScript pour détecter les erreurs
- **eslint-config-prettier** `^10.1.1` - Configuration ESLint compatible avec Prettier
- **eslint-plugin-prettier** `^5.2.5` - Plugin ESLint pour intégrer Prettier
- **prettier** `^3.5.3` - Formateur de code automatique
- **typescript-eslint** `8.27.0` - Parser et règles ESLint pour TypeScript

### Types et Compilation
- **@types/chart.js** `^2.9.41` - Types TypeScript pour Chart.js
- **typescript** `~5.4.2` - Langage de programmation TypeScript

## 📊 Utilisation par Catégorie

### Interface Utilisateur (35%)
- Angular Material, PrimeNG, Bootstrap pour les composants UI
- Icônes et thèmes pour l'esthétique

### Visualisation de Données (20%)
- FullCalendar pour les calendriers
- ApexCharts et Chart.js pour les graphiques

### Fonctionnalités Métier (25%)
- Scanner QR/codes-barres
- Export PDF/Excel
- Communication temps réel

### Développement et Qualité (20%)
- Outils de test, linting et formatage
- Build et compilation

## 🎯 Recommandations

### Sécurité
- Toutes les dépendances sont maintenues à jour
- Audit régulier avec `npm audit`

### Performance
- Utilisation du lazy loading pour optimiser les imports
- Tree-shaking automatique avec Angular CLI

### Maintenance
- Versions compatibles entre elles
- Documentation à jour pour chaque nouvelle dépendance

---

*Dernière mise à jour : Juin 2025*
*Version du projet : 0.0.0*
