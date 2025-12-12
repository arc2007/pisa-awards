import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CategoriasListComponent } from './pages/categorias-list/categorias-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'categorias', component: CategoriasListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
