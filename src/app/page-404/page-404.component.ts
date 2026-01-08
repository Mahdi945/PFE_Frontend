import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-404',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-404.component.html',
  styleUrls: ['./page-404.component.css'],
})
export class Page404Component {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
