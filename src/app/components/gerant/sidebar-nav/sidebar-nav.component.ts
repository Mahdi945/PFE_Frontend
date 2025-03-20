import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavItemComponent } from "./../nav-item/nav-item.component";
import { Router } from "@angular/router";

@Component({
  selector: "app-sidebar-nav",
  standalone: true,
  imports: [CommonModule, NavItemComponent],
  templateUrl: "./sidebar-nav.component.html",
  styleUrls: ["./sidebar-nav.component.css"],
})
export class SidebarNavComponent {
   constructor(private router: Router) {}

   goToRegister() {
    this.router.navigate(["/login"]);
  }

}
