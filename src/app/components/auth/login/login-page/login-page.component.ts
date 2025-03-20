import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { LoginFormComponent } from "./../login-form/login-form.component";

@Component({
  selector: "app-login-page",
  standalone: true,
  imports: [LoginFormComponent],
  templateUrl: "./login-page.component.html",
  styleUrls: ["./login-page.component.css"],
})
export class LoginPageComponent {
  constructor(private router: Router) {}

  goToRegister() {
    this.router.navigate(["/register"]);
  }
}
