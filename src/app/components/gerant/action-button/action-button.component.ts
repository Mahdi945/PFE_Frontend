import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-action-button",
  templateUrl: "./action-button.component.html",
  styleUrls: ["./action-button.component.css"],
  standalone: true,
})
export class ActionButtonComponent {
  @Input() label: string = "";
  @Output() onClick = new EventEmitter<void>();
  @Input() disabled: boolean = false; 
}
