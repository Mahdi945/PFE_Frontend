import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { LoginPageComponent } from './components/auth/login/login-page/login-page.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoginPageComponent],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  title = 'Gestion Station Service';
}
