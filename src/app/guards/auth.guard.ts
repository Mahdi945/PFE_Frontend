import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
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
        if (user?.role) {
          return this.checkAccess(user, next, state.url);
        }

        return this.authService.getProfile().pipe(
          switchMap(profile => {
            if (!profile) return this.denyAccess(state.url);

            const normalizedUser = this.normalizeProfile(profile);
            if (!normalizedUser.role) return this.denyAccess(state.url);

            return this.checkAccess(normalizedUser, next, state.url);
          }),
          catchError(() => this.denyAccess(state.url))
        );
      })
    );
  }

  private normalizeProfile(profile: any): any {
    if (Array.isArray(profile)) {
      return profile[0]?.[0] || profile[0] || profile;
    }
    return profile.user || profile;
  }

  private checkAccess(
    user: any,
    route: ActivatedRouteSnapshot,
    returnUrl: string
  ): Observable<boolean> {
    const userRole = user.role.toLowerCase();
    const routePath = route.routeConfig?.path || '';

    // Vérification des routes dashboard
    if (routePath.startsWith('dashboard-')) {
      const requiredRole = routePath.split('-')[1].toLowerCase();

      if (userRole !== requiredRole) {
        console.warn(
          `Accès refusé : ${userRole} ne peut pas accéder à ${routePath}`
        );
        this.router.navigate(['/access-denied'], {
          state: {
            requiredRole,
            userRole,
            attemptedUrl: returnUrl,
          },
        });
        return of(false);
      }
      return of(true);
    }

    // Vérification des autres routes protégées
    const requiredPermission = route.data['requiredPermission'];
    if (!requiredPermission) return of(true);

    return this.authService.getPermissionsByRole(userRole).pipe(
      map(permissions => {
        const hasPermission = permissions.some(
          p =>
            p.element_name.trim() === requiredPermission.trim() && p.is_visible === 1
        );

        if (!hasPermission) {
          this.router.navigate(['/access-denied'], {
            state: { requiredPermission, userRole, attemptedUrl: returnUrl },
          });
        }
        return hasPermission;
      }),
      catchError(() => this.denyAccess(returnUrl))
    );
  }

  private denyAccess(returnUrl: string): Observable<boolean> {
    if (!returnUrl.includes('/login')) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: returnUrl || '/' },
      });
    }
    return of(false);
  }
}
