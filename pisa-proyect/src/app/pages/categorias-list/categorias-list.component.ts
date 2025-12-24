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

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  constructor(
    private categoriasService: CategoriasService,
    private votosService: VotosService,
    public authService: AuthService,
    public router: Router
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
    this.categoriasService.getCategoriasEstado(this.usuario.id).subscribe({
      next: (cats) => {
        this.categorias = (cats || []).map((c: any) => ({
          ...c,
          miVotoNominacionId:
            c.miVotoNominacionId === null || c.miVotoNominacionId === undefined
              ? null
              : Number(c.miVotoNominacionId),
          nominados: (c.nominados || []).map((n: any) => ({
            ...n,
            id: Number(n.id),
            usuarios: Array.isArray(n.usuarios)
              ? n.usuarios.map((u: any) => ({
                ...u,
                id: Number(u?.id),
              }))
              : [],
          })),
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        alert('Error cargando categorías');
        this.cdr.detectChanges();
      },
    });
  }

  toggleCategoria(cat: any): void {
    this.categoriaAbierta = this.categoriaAbierta === cat.id ? null : cat.id;
    this.cdr.detectChanges();
  }

  getMiVotoDescripcion(cat: any): string | null {
    const id = cat?.miVotoNominacionId;
    if (!id || !Array.isArray(cat?.nominados)) return null;
    const nom = cat.nominados.find((n: any) => n.id === id);
    return nom?.descripcion ?? null;
  }

  usuarioEstaEnNominacion(nominacion: any): boolean {
    const userId = Number(this.usuario?.id);
    if (!Number.isFinite(userId)) return false;

    const ids: number[] = Array.isArray(nominacion?.usuarios)
      ? nominacion.usuarios
        .map((u: any) => Number(u?.id))
        .filter((id: any) => Number.isFinite(id))
      : [];

    return ids.includes(userId);
  }

  abrirModal(categoria: any, nominacion: any): void {
    if (categoria.miVotoNominacionId === nominacion.id) return;
    if (this.usuarioEstaEnNominacion(nominacion)) return;

    const modo: 'votar' | 'editar' = categoria.haVotado ? 'editar' : 'votar';

    const usuarioIds: number[] = Array.isArray(nominacion?.usuarios)
      ? nominacion.usuarios
        .map((u: any) => Number(u?.id))
        .filter((id: any) => Number.isFinite(id))
      : [];

    const dialogRef = this.dialog.open(VotarModalComponent, {
      width: '420px',
      maxWidth: '95vw',
      panelClass: 'votar-dialog',
      data: {
        modo,
        categoriaNombre: categoria.nombre,
        nominacionDescripcion: nominacion.descripcion,
        usuarioIds,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) this.votar(categoria, nominacion);
    });
  }

  votar(categoria: any, nominacion: any): void {
    if (this.usuarioEstaEnNominacion(nominacion)) return;

    this.votosService.votar(this.usuario.id, categoria.id, nominacion.id).subscribe({
      next: () => {
        categoria.haVotado = true;
        categoria.miVotoNominacionId = Number(nominacion.id);

        if (this.isAdmin) {
          this.categoriasService.getCategoriasEstado(this.usuario.id).subscribe({
            next: (cats) => {
              const updated = cats.find((c: any) => c.id === categoria.id);
              if (updated) {
                categoria.resultados = updated.resultados;
              }
              this.cdr.detectChanges();
            },
          });
        } else {
          this.cdr.detectChanges();
        }
      },
      error: (err) => alert(err.error?.error || 'Error al votar'),
    });
  }

  getUsuariosTexto(nom: any): string {
    if (!nom?.usuarios || nom.usuarios.length === 0) return '';
    return nom.usuarios.map((u: any) => u.display_name).join(', ');
  }

  trackByCatId(_i: number, cat: any) {
    return cat.id;
  }
}
