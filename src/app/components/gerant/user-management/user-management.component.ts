import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ActionButtonComponent } from "../action-button/action-button.component";

interface User {
  id: number;
  username: string;
  email: string;
  numero_telefone: string;
  password: string;
  role: string;
}

@Component({
  selector: "app-user-management",
  standalone: true, // ✅ Add this for standalone components
  imports: [CommonModule, ReactiveFormsModule, ActionButtonComponent], // ✅ Import required modules
  templateUrl: "./user-management.component.html",
  styleUrls: ["./user-management.component.css"],
})
export class UserManagementComponent {
  userForm: FormGroup;
  users: User[] = [];
  editingUser: User | null = null;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      username: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      numero_telefone: ["", Validators.required],
      password: ["", Validators.required],
      role: ["User", Validators.required],
    });
  }

  addUser() {
    if (this.userForm.valid) {
      if (this.editingUser) {
        this.users = this.users.map((user) =>
          user.id === this.editingUser!.id
            ? { ...this.userForm.value, id: user.id }
            : user
        );
        this.editingUser = null;
      } else {
        this.users.push({
          ...this.userForm.value,
          id: Date.now(),
        });
      }
      this.userForm.reset();
    }
  }

  editUser(user: User) {
    this.editingUser = user;
    this.userForm.setValue({
      username: user.username,
      email: user.email,
      numero_telefone: user.numero_telefone,
      password: user.password,
      role: user.role,
    });
  }

  deleteUser(id: number) {
    this.users = this.users.filter((user) => user.id !== id);
  }
}
