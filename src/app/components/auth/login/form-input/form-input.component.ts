import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common"; 
@Component({
  selector: "app-form-input",
  templateUrl: "./form-input.component.html",
  styleUrls: ["./form-input.component.css"],
  standalone: true,
  imports: [FormsModule,CommonModule],
})
export class FormInputComponent {
  @Input() label: string = "";
  @Input() type: string = "text";
  @Input() value: string = "";

  onValueChange(value: string) {
    this.value = value;
  }
}
