import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CategoriasService } from '../../services/categorias.service';
import { VotosService } from '../../services/votos.services';
import { AuthService } from '../../services/auth.service';
import { VotarModalComponent } from '../components/votar-modal/votar-modal.component';

@Component({
  selector: 'app-categorias-list',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './categorias-list.component.html',
  styleUrls: ['./categorias-list.component.scss'],
})
export class CategoriasListComponent implements OnInit {
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  usuario: any;
  categorias: any[] = [];
  loading = false;

  categoriaAbierta: number | null = null;

  constructor(
    private categoriasService: CategoriasService,
    private votosService: VotosService,
    public authService: AuthService,
    public router: Router,
  ) { }

  ngOnInit(): void {
    this.usuario = this.authService.getCurrentUser();
    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarCategorias();
    this.cdr.detectChanges();
  }

  cargarCategorias(): void {
    this.loading = true;
    this.categoriasService
      .getCategoriasEstado(this.usuario.id)
      .subscribe((cats) => {
        this.categorias = cats;
        this.loading = false;
        this.cdr.detectChanges();
        console.log(cats)
      });
  }

  toggleCategoria(cat: any): void {
    this.categoriaAbierta =
      this.categoriaAbierta === cat.id ? null : cat.id;
    this.cdr.detectChanges();
  }

  abrirModal(categoria: any, nominacion: any): void {
    const frase = `¿Seguro que quieres votar a "${nominacion.descripcion}" en la categoría "${categoria.nombre}"?`;

    const dialogRef = this.dialog.open(VotarModalComponent, {
      width: '400px',
      data: {
        frase,
        categoria,
        nominacion,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.votar(categoria, nominacion);
      }
    });
  }

  votar(categoria: any, nominacion: any): void {
    this.votosService
      .votar(this.usuario.id, categoria.id, nominacion.id)
      .subscribe({
        next: () => {
          categoria.haVotado = true;

          this.categoriasService
            .getTopCategoria(categoria.id)
            .subscribe((top) => {
              categoria.topNominados = top;
            });
        },
        error: (err) => {
          alert(err.error?.error || 'Error al votar');
        },
      });
  }

  getUsuariosTexto(nom: any): string {
    if (!nom?.usuarios || nom.usuarios.length === 0) {
      return '';
    }

    return nom.usuarios
      .map((u: any) => u.display_name)
      .join(', ');
  }
}
