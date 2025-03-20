import { Routes } from '@angular/router';
import{ LoginPageComponent } from './components/auth/login/login-page/login-page.component'; 
import{ RegisterPageComponent } from './components/auth/register/register-page/register-page.component';
import { DashboardLayoutComponent } from './components/gerant/dashboard-layout/dashboard-layout.component';
export const routes: Routes = [
    { path: 'login', component: LoginPageComponent },
    { path: 'register', component: RegisterPageComponent },
    { path: 'dashboard', component: DashboardLayoutComponent }, // Use the correct component name
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' } // Redirect to login by default
  ];
  