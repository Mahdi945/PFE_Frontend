import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.css']
})
export class ErrorDialogComponent implements OnInit, OnDestroy {
  message: string;
  private autoCloseSubscription: Subscription = new Subscription(); // Initialisation ici

  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) {
    this.message = data.message;
  }

  ngOnInit(): void {
    // Par exemple, fermer automatiquement après 3 secondes
    this.autoCloseSubscription = timer(3000).subscribe(() => {
      // Logique pour fermer le modal automatiquement après 3 secondes
      // Vous pouvez appeler la méthode de fermeture ici si nécessaire
    });
  }

  ngOnDestroy(): void {
    // Se désabonner pour éviter les fuites de mémoire
    if (this.autoCloseSubscription) {
      this.autoCloseSubscription.unsubscribe();
    }
  }
}
