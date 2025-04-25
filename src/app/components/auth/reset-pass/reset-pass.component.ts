import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';  
import { Router, ActivatedRoute } from '@angular/router';  
import { CommonModule } from '@angular/common';  
import { ReactiveFormsModule } from '@angular/forms';  
import { RouterModule } from '@angular/router';  
import { MatIconModule } from '@angular/material/icon';  

@Component({
  selector: 'app-reset-pass',
  standalone: true,  
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],  
  templateUrl: './reset-pass.component.html',
  styleUrls: ['./reset-pass.component.css']
})
export class ResetPassComponent implements OnInit {
  message = '';  
  isError = false; 
  isLoading = false;
  resetPasswordForm: FormGroup;
  passwordVisible = false;
  confirmPasswordVisible = false;
  passwordStrength = ''; 
  token = ''; 

  constructor(
    private authService: AuthService, 
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute  
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [
        Validators.required, 
        Validators.minLength(8), 
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)  
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

    // Écouter les changements sur le champ password
    this.resetPasswordForm.get('password')?.valueChanges.subscribe(val => {
      this.onPasswordChange(val);
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || ''; 
    if (!this.token) {
      this.message = 'Lien invalide ou expiré.';
      this.isError = true;
    }
  }

  // Getters pour les contrôles du formulaire
  get passwordControl() {
    return this.resetPasswordForm.get('password');
  }

  get confirmPasswordControl() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  // Getters pour les critères de mot de passe
  get passwordHasMinLength() {
    return this.passwordControl?.value?.length >= 8;
  }

  get passwordHasUpperCase() {
    return /[A-Z]/.test(this.passwordControl?.value);
  }

  get passwordHasNumber() {
    return /\d/.test(this.passwordControl?.value);
  }

  get passwordHasSpecialChar() {
    return /[\W_]/.test(this.passwordControl?.value);
  }

  // Validateur de correspondance des mots de passe
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  // Analyse de la force du mot de passe
  onPasswordChange(password: string) {
    if (!password) {
      this.passwordStrength = '';
      return;
    }

    const lengthValid = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[\W_]/.test(password);
    
    if (lengthValid && hasUpperCase && hasDigit && hasSpecialChar) {
      this.passwordStrength = password.length >= 14 ? 'strong' : 'medium';
    } else {
      this.passwordStrength = 'weak';
    }
  }

  // Soumission du formulaire
  onResetPassword() {
    if (this.resetPasswordForm.invalid || !this.token) {
      return;
    }

    this.isLoading = true;
    const newPassword = this.resetPasswordForm.value.password;

    this.authService.resetPassword(newPassword, this.token).subscribe(
      () => {
        this.message = 'Mot de passe réinitialisé avec succès.';
        this.isError = false;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      (error) => {
        this.isLoading = false;
        this.isError = true;
        this.message = error.status === 400 ? 'Le token est invalide ou a expiré.' :
                      error.status === 401 ? 'Accès non autorisé. Vérifiez le lien.' :
                      error.status === 404 ? 'Utilisateur non trouvé.' :
                      'Une erreur est survenue. Veuillez réessayer plus tard.';
      }
    );
  }

  // Basculer la visibilité du mot de passe
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  // Basculer la visibilité de la confirmation
  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }
}