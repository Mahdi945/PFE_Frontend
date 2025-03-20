import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserProfileComponent } from "./../user-profile/user-profile.component";

@Component({
  selector: "app-top-bar",
  standalone: true,
  imports: [CommonModule, UserProfileComponent],
  templateUrl: "./top-bar.component.html",
  styleUrls: ["./top-bar.component.css"],
})
export class TopBarComponent {}
