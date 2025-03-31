import { Component } from '@angular/core';
import { NavbarComponent } from '../components/navbar/navbar.component'; 
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { FooterComponent } from '../components/footer/footer.component'; 
@Component({
  selector: 'app-index',
  standalone: true,
  imports: [NavbarComponent,SidebarComponent,FooterComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css'
})
export class IndexComponent {

}
