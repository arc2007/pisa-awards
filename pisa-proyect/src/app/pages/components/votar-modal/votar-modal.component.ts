import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-votar-modal',
  standalone: true,
  templateUrl: './votar-modal.component.html',
  styleUrls: ['./votar-modal.component.scss'],
  imports: [
    CommonModule,        
    MatDialogModule,
    MatButtonModule,
  ],
})
export class VotarModalComponent {
  constructor(
    public dialogRef: MatDialogRef<VotarModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      modo: 'votar' | 'editar';
      categoriaNombre: string;
      nominacionDescripcion: string;
      usuarioIds?: number[];
    }
  ) { }

  getFotoPerfilUrl(userId: number): string {
    console.log(`assets/fotos-perfil/${userId}.png`)
    
    return `assets/fotos-perfil/${userId}.png`;
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}
