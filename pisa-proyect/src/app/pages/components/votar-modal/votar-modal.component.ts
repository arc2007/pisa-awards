import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-votar-modal',
  templateUrl: './votar-modal.component.html',
  imports: [MatDialogModule, MatButtonModule],
  styleUrls: ['./votar-modal.component.scss'],
})
export class VotarModalComponent {
  constructor(
    public dialogRef: MatDialogRef<VotarModalComponent>,
  ) {}

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}
