import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-nav-item",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./nav-item.component.html",
  styleUrls: ["./nav-item.component.css"],
})
export class NavItemComponent {
  @Input() icon: string = "";
  @Input() label: string = "";
}
