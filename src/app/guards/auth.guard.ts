import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        // Si l'utilisateur est déjà chargé et valide
        if (user?.role) {
          console.log('[AuthGuard] Utilisateur existant:', user);
          return this.verifyAccess(user, next, state.url);
        }
        
        // Sinon, charger le profil depuis le serveur
        console.log('[AuthGuard] Chargement du profil...');
        return this.authService.getProfile().pipe(
          switchMap(profile => {
            if (!profile) {
              console.error('[AuthGuard] Aucun profil reçu');
              return this.denyAccess(state.url);
            }

            // Normaliser la structure du profil
            const normalizedProfile = this.normalizeProfile(profile);
            
            if (!normalizedProfile.role) {
              console.error('[AuthGuard] Aucun rôle défini dans le profil');
              return this.denyAccess(state.url);
            }

            console.log('[AuthGuard] Profil chargé:', normalizedProfile);
            return this.verifyAccess(normalizedProfile, next, state.url);
          }),
          catchError(error => {
            console.error('[AuthGuard] Erreur chargement profil:', error);
            return this.denyAccess(state.url);
          })
        );
      })
    );
  }

  private normalizeProfile(profile: any): any {
    // Gestion des différentes structures de réponse
    if (Array.isArray(profile)) {
      return profile[0]?.[0] || profile[0] || profile;
    }
    return profile.user || profile;
  }

  private verifyAccess(user: any, route: ActivatedRouteSnapshot, returnUrl: string): Observable<boolean> {
    const normalizedRole = user.role.toLowerCase();
    const routePath = route.routeConfig?.path || '';
    const requiredPermission = route.data['requiredPermission'];

    console.log(`[AuthGuard] Vérification accès pour ${normalizedRole} sur ${routePath}`);

    // 1. Vérifier les routes dashboard
    if (routePath.match(/^dashb?ord-/i)) {
      const normalizedPath = routePath.toLowerCase().replace('dashbord', 'dashboard');
      const expectedPath = `dashboard-${normalizedRole}`;

      if (normalizedPath === expectedPath) {
        return of(true);
      }

      console.warn(`[AuthGuard] Accès dashboard refusé: ${normalizedRole} ne peut pas accéder à ${normalizedPath}`);
      this.router.navigate(['/access-denied']);
      return of(false);
    }

    // 2. Vérifier les permissions pour les autres routes
    if (!requiredPermission) {
      return of(true); // Route sans permission requise
    }

    return this.authService.getPermissionsByRole(normalizedRole).pipe(
      tap(permissions => {
        console.log('[AuthGuard] Permissions disponibles:', permissions);
      }),
      map(permissions => {
        const hasPermission = permissions.some(p => 
          p.element_name.trim() === requiredPermission.trim() && p.is_visible === 1
        );

        console.log(`[AuthGuard] Permission "${requiredPermission}" trouvée: ${hasPermission}`);

        if (!hasPermission) {
          this.router.navigate(['/access-denied'], {
            state: {
              requiredPermission,
              userRole: normalizedRole,
              attemptedUrl: returnUrl
            }
          });
          return false;
        }
        return true;
      }),
      catchError(error => {
        console.error('[AuthGuard] Erreur vérification permissions:', error);
        return this.denyAccess(returnUrl);
      })
    );
  }

  private denyAccess(returnUrl: string): Observable<boolean> {
    // Ne pas rediriger vers login si déjà sur login
    if (!returnUrl.includes('/login')) {
      console.log('[AuthGuard] Redirection vers login');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: returnUrl || '/' }
      });
    }
    return of(false);
  }
}