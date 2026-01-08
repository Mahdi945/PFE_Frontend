import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.css'],
})
export class AccessDeniedComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
