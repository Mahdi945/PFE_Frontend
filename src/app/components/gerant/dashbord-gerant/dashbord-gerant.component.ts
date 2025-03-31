import { Component } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component'; 
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component'; 
@Component({
  selector: 'app-dashbord-gerant',
  standalone: true,
  imports: [NavbarComponent,SidebarComponent,FooterComponent],
  templateUrl: './dashbord-gerant.component.html',
  styleUrl: './dashbord-gerant.component.css'
})
export class DashbordGerantComponent {

}
