import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from "@angular/forms"; 
import { ActionButtonComponent } from './../action-button/action-button.component';
import { FormInputComponent } from "./../form-input/form-input.component";

@Component({
  selector: "app-login-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormInputComponent, ActionButtonComponent], // Removed unused imports
  templateUrl: "./login-form.component.html",
  styleUrls: ["./login-form.component.css"],
})
export class LoginFormComponent implements OnInit {
  loginForm!: FormGroup; // Definite assignment assertion

  constructor(private router: Router) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.loginForm = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.email]),
      password: new FormControl("", [Validators.required, Validators.minLength(6)]),
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      console.log("Login attempted with:", this.loginForm.value);
      // Add authentication logic here
    } else {
      console.log("Form is invalid");
    }
  }

  goToRegister() {
    this.router.navigate(["/register"]);
  }

  isFieldInvalid(field: string) {
    return this.loginForm.get(field)?.touched || this.loginForm.get(field)?.dirty;
  }
}
