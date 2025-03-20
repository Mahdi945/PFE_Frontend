import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-input-filed",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./input-filed.component.html",
  styleUrls: ["./input-filed.component.css"],
})
export class InputFiledComponent {
  @Input() label: string = "";
  @Input() type: string = "text";
  @Input() placeholder: string = "";
  @Input() value: string = "";

  onValueChange(value: string) {
    this.value = value;
  }
}
