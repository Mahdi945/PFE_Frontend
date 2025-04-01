import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importer RouterModule

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    RouterModule
  ]
})
export class LoginComponent {
  loginForm: FormGroup;
  isPasswordVisible = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  showError(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000, // Durée de l'affichage (3s)
      verticalPosition: 'top', // En haut de l'écran
      horizontalPosition: 'center', // Centré horizontalement
      panelClass: ['error-snackbar'] // Classe CSS pour la personnalisation
    });
  }


  

  onLogin() {
    if (this.loginForm.invalid) {
      this.showError('Veuillez remplir tous les champs.');
      return;
    }
  
    const credentials = this.loginForm.value;
    console.log(credentials); // Vérifiez que l'objet envoyé contient bien usernameOrEmail et password
  
    // Déterminer si le champ usernameOrEmail est un email ou un username
    const isEmail = credentials.usernameOrEmail.includes('@');
    const body = isEmail
      ? { email: credentials.usernameOrEmail, password: credentials.password }
      : { username: credentials.usernameOrEmail, password: credentials.password };
  
    this.authService.login(body).subscribe(
      (response) => {
        console.log('Connexion réussie', response);
       
  
        // Assurez-vous que la réponse contient bien un objet avec la structure attendue (ex. { message, user })
        const user = response.user; // Récupérer l'utilisateur de la réponse
        if (user && user.role) {
          // Récupérer le rôle de l'utilisateur à partir de l'objet 'user'
          const role = user.role;
  
          if (role === 'gerant') {
            this.router.navigate(['/dashboard-gerant']);
          } else if (role === 'cogerant') {
            this.router.navigate(['/dashboard-cogerant']);
          } else if (role === 'pompiste') {
            this.router.navigate(['/dashboard-pompiste']);
          } else if (role === 'caissier') {
            this.router.navigate(['/dashboard-caissier']);
          } else if (role === 'client') {
            this.router.navigate(['/dashboard-client']);
          } else {
            this.showError('Rôle inconnu, impossible de rediriger.');
          }
        } else {
          this.showError('Erreur: rôle non trouvé dans la réponse du serveur.');
        }
      },
      (error) => {
        console.error('Erreur de connexion', error);
        let errorMessage = 'Une erreur est survenue.';
  
        if (error.status === 400) {
          errorMessage = "Nom d'utilisateur ou email et mot de passe requis.";
        } else if (error.status === 401) {
          errorMessage = "Nom d'utilisateur, email ou mot de passe incorrect.";
        } else if (error.status === 403) {
          errorMessage = "Votre compte est désactivé. Contactez l'administration.";
        } else if (error.status === 500) {
          errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
        }
  
        this.showError(errorMessage);
      }
    );
  }
  
}
