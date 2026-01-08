import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { IndexComponent } from './index/index.component';
import { ForgotPassComponent } from './components/auth/forgot-pass/forgot-pass.component';
import { ResetPassComponent } from './components/auth/reset-pass/reset-pass.component';
import { Page404Component } from './page-404/page-404.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { DashbordGerantComponent } from './components/gerant/dashbord-gerant/dashbord-gerant.component';
import { DashboardCogerantComponent } from './components/cogerant/dashboard-cogerant/dashboard-cogerant.component';
import { DashboardPompisteComponent } from './components/pompiste/dashboard-pompiste/dashboard-pompiste.component';
import { DashboardCaissierComponent } from './components/caissier/dashboard-caissier/dashboard-caissier.component';
import { DashboardClientComponent } from './components/client/dashboard-client/dashboard-client.component';
import { ProfileComponent } from './components/profile/profile.component';
import { GestionUtilisateursComponent } from './components/gestion-utilisateurs/gestion-utilisateurs.component';
import { AjouterUtilisateurComponent } from './components/ajouter-utilisateur/ajouter-utilisateur.component';
import { GestionAffectationsPompistesComponent } from './components/gestion-affectations-pompistes/gestion-affectations-pompistes.component';
import { GestionPompesComponent } from './components/gestion-pompes/gestion-pompes.component';
import { AjouterPompeComponent } from './components/ajouter-pompe/ajouter-pompe.component';
import { GestionStockComponent } from './components/gestion-stock/gestion-stock.component';
import { GestionCreditsComponent } from './components/gestion-credits/gestion-credits.component';
import { GestionVehiculesComponent } from './components/gestion-vehicules/gestion-vehicules.component';
import { GestionPaimentsComponent } from './components/gestion-paiments/gestion-paiments.component';
import { GestionTransactionsComponent } from './components/gestion-transactions/gestion-transactions.component';
import { SaisieCreditComponent } from './components/saisie-credit/saisie-credit.component';
import { SaisieIndexComponent } from './components/saisie-index/saisie-index.component';
import { SaisiePaiementComponent } from './components/saisie-paiement/saisie-paiement.component';
import { AjouterVenteComponent } from './components/ajouter-vente/ajouter-vente.component';
import { VisualiserRevenuesComponent } from './components/visualiser-revenues/visualiser-revenues.component';
import { DocumentationComponent } from './components/documentation/documentation.component';
import { EnvoyerReclamationComponent } from './components/envoyer-reclamation/envoyer-reclamation.component';
import { TraiterReclamationsComponent } from './components/traiter-reclamations/traiter-reclamations.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'forgetEmail', component: ForgotPassComponent },
  { path: 'reset-password', component: ResetPassComponent },
  { path: 'access-denied', component: AccessDeniedComponent },

  // Protected routes
  {
    path: 'dashboard-gerant',
    component: DashbordGerantComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard-cogerant',
    component: DashboardCogerantComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard-pompiste',
    component: DashboardPompisteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard-caissier',
    component: DashboardCaissierComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard-client',
    component: DashboardClientComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile-utilisateur',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'documentation',
    component: DocumentationComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'envoyer-reclamation',
    component: EnvoyerReclamationComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Réclamer' },
  },
  {
    path: 'traiter-reclamations',
    component: TraiterReclamationsComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Traiter les réclamations' },
  },

  {
    path: 'gestion-utilisateurs',
    component: GestionUtilisateursComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Utilisateurs' },
  },
  {
    path: 'ajouter-utilisateur',
    component: AjouterUtilisateurComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Créer compte' },
  },

  {
    path: 'gestion-affectations-pompistes',
    component: GestionAffectationsPompistesComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Affecter pompistes' },
  },
  {
    path: 'liste-pompes',
    component: GestionPompesComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Liste pompes' },
  },
  {
    path: 'ajouter-pompe',
    component: AjouterPompeComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Enregistrer pompe' },
  },

  {
    path: 'gestion-credits',
    component: GestionCreditsComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Crédits' },
  },
  {
    path: 'gestion-vehicules',
    component: GestionVehiculesComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Enregistrer Véhicules' },
  },
  {
    path: 'gestion-transactions',
    component: GestionTransactionsComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Historique des Transactions' },
  },
  {
    path: 'liste-paiements',
    component: GestionPaimentsComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Historique des Paiements' },
  },
  {
    path: 'saisie-credit',
    component: SaisieCreditComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Saisie vente credit' },
  },
  {
    path: 'saisie-index',
    component: SaisieIndexComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Saisie Index fermeture' },
  },
  {
    path: 'saisie-paiement',
    component: SaisiePaiementComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Saisie Paiements' },
  },
  {
    path: 'gestion-stock',
    component: GestionStockComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Gérer le Stock' },
  },
  {
    path: 'ajouter-vente',
    component: AjouterVenteComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Point de vente' },
  },
  {
    path: 'visualiser-revenues',
    component: VisualiserRevenuesComponent,
    canActivate: [AuthGuard],
    data: { requiredPermission: 'Visualiser Revenues' },
  },
  {
    path: 'index',
    component: IndexComponent,
  },

  // Default route
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // 404 route (must be last)
  { path: '**', component: Page404Component },
];
