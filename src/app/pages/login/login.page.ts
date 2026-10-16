import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService, mensajeError } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [IonContent, FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  correo = '';
  clave = '';
  error = signal('');
  cargando = signal(false);

  async enviar(modo: 'entrar' | 'crear') {
    this.error.set('');
    if (!this.correo || !this.clave) {
      this.error.set('Escribe tu correo y contraseña.');
      return;
    }
    this.cargando.set(true);
    try {
      if (modo === 'entrar') await this.auth.entrar(this.correo, this.clave);
      else await this.auth.crearCuenta(this.correo, this.clave);
      await this.router.navigateByUrl('/tabs/mes', { replaceUrl: true });
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
