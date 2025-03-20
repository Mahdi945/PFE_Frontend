import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SidebarNavComponent } from "./../sidebar-nav/sidebar-nav.component";
import { TopBarComponent } from "./../top-bar/top-bar.component";
import { UserManagementComponent } from "../user-management/user-management.component";

@Component({
  selector: "app-dashboard-layout",
  standalone: true,
  imports: [CommonModule, SidebarNavComponent, TopBarComponent, UserManagementComponent],
  templateUrl: "./dashboard-layout.component.html",
  styleUrls: ["./dashboard-layout.component.css"],
})
export class DashboardLayoutComponent {}
