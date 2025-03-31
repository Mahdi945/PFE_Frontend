import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; 
import { CommonModule } from '@angular/common';

import { SpinnerComponent } from './spinner/spinner.component';  // Importation du SpinnerComponent
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet,SpinnerComponent],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  title = 'Gestion Station Service';
}
