# Finanzas

App personal de presupuesto mensual (PWA para iPhone). Hecha con **Ionic 9 + Angular 21 + Firebase**.

La idea: pones tu sueldo líquido, le das un destino a cada peso (presupuestos + fondo de emergencia) hasta que quede en $0, y durante el mes vas anotando gastos que se descuentan solos. Al cierre ves cuánto debería sobrarte y lo comparas con lo que realmente tienes.

App publicada: https://diegoabricotc-ui.github.io/finanzas/

## Cómo está organizado

```
src/app/
  firebase.ts            conexión con Firebase (Auth + Firestore con cache offline)
  models.ts              tipos de datos y cómo se guardan en Firestore
  calculos.ts            toda la matemática (por asignar, lo que queda, fondo de emergencia)
  util.ts                formato de plata ($650.000), fechas, etc.
  services/
    auth.service.ts      login con correo y contraseña
    finanzas.service.ts  lee y guarda meses y gastos (escucha en vivo con onSnapshot)
  pages/
    login/               entrar o crear cuenta
    armar/               armar o editar el mes (sueldo, % emergencia, presupuestos)
    tabs/                barra de abajo (Mes, Movimientos, Resumen)
    mes/                 lo que te queda, cada presupuesto con su barra y el modal "Nuevo gasto"
    movimientos/         gastos del mes agrupados por día
    resumen/             gráfico presupuesto vs gastado, cierre del mes y fondo de emergencia
```

## Datos en Firestore

```
usuarios/{uid}/meses/{2026-10}        sueldo, porcentajeEmergencia, presupuestos[], cerrado...
usuarios/{uid}/movimientos/{id}       mes, presupuestoId, nombre, monto, fecha
```

Reglas de seguridad (pegadas en Firestore > Reglas):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Correr en tu PC

Necesitas Node 22 (LTS).

```
npm install
npm start
```

Abre http://localhost:4200

## Publicar

Cada `git push` a `main` dispara `.github/workflows/deploy.yml`, que compila y publica en GitHub Pages automáticamente.
