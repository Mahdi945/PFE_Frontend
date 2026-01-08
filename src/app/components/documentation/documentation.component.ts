import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './documentation.component.html',
  styleUrl: './documentation.component.css',
})
export class DocumentationComponent {}
