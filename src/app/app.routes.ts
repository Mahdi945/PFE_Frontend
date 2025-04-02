import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component'; 
import { IndexComponent } from './index/index.component';
import { ForgotPassComponent } from './components/auth/forgot-pass/forgot-pass.component';
import { ResetPassComponent } from './components/auth/reset-pass/reset-pass.component';
import { Page404Component } from './page-404/page-404.component'; // Importer la page 404
import{DashbordGerantComponent} from './components/gerant/dashbord-gerant/dashbord-gerant.component';
import{DashboardCogerantComponent} from './components/cogerant/dashboard-cogerant/dashboard-cogerant.component';
import{DashboardPompisteComponent} from './components/pompiste/dashboard-pompiste/dashboard-pompiste.component';
import{DashboardCaissierComponent} from './components/caissier/dashboard-caissier/dashboard-caissier.component';
import{DashboardClientComponent} from './components/client/dashboard-client/dashboard-client.component';
import{ProfileComponent} from './components/profile/profile.component';
import{GestionUtilisateursComponent} from './components/gerant/gestion-utilisateurs/gestion-utilisateurs.component';
import{AjouterUtilisateurComponent} from './components/gerant/ajouter-utilisateur/ajouter-utilisateur.component';
import{GestionComptesComponent} from './components/gerant/gestion-comptes/gestion-comptes.component';
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgetEmail', component: ForgotPassComponent },
  { path: 'reset-password', component: ResetPassComponent },
  { path: 'dashboard-gerant', component: DashbordGerantComponent },
  { path: 'dashboard-cogerant', component: DashboardCogerantComponent },
  { path: 'dashboard-pompiste', component: DashboardPompisteComponent },
  { path: 'dashboard-caissier', component: DashboardCaissierComponent },
  { path: 'dashboard-client', component: DashboardClientComponent },
  { path: 'profile-utilisateur', component: ProfileComponent },
  {path: 'gestion-utilisateurs',component: GestionUtilisateursComponent},
  {path: 'ajouter-utilisateur',component: AjouterUtilisateurComponent},
   {path:'gestion-comptes', component: GestionComptesComponent},


  { path: 'index', component: IndexComponent },
  
  // Route par défaut pour rediriger vers l'index
  { path: '', redirectTo: '/index', pathMatch: 'full' },
  // Route pour la page 404 (doit être la dernière)
  { path: '**', component: Page404Component }

  
];
