# Portal VEN 911 — Rama `demo` (Portafolio)

Portal interno del Centro de Comando, Control y Telecomunicaciones **VEN 911** para la
gestión de noticias, reportes, formatos, reposos/permisos, informes técnicos,
cambios de guardia, usuarios y bitácora de auditoría.

> ⚠️ Esta rama es una **demostración pública** con datos **100% inventados** para
> propósitos de portafolio. No contiene información real de la organización.

## Credenciales de demostración

| Campo       | Valor                |
| ----------- | -------------------- |
| Usuario     | `demo@ven911.gob.ve` |
| Contraseña  | `demo1234`           |

Rol: **Administrador** (acceso a todos los módulos). La pantalla de inicio muestra
estas credenciales con un botón «Usar credenciales demo» que autocompleta el
formulario.

Si prefieres otro rol de acceso rápido, los demás usuarios del seed también usan
`demo1234` (María Fernández/Coordinador, Carlos Ramírez/Prensa, Ana Martínez/Gestión
Humana).

## Base de datos demo

La rama usa su **propia base de datos en NeonDB** (proyecto `demo`), separada de la
producción. El esquema ya está creado en Neon; los datos se cargan con el script
`db/seed-demo.sql`, desde el **editor SQL de Neon** (cópialo y ejecútalo sin
restricciones) o localmente con:

```bash
DEMO_DB_URL='postgresql://.../neondb' node scripts/run-sql.mjs --reset db/seed-demo.sql
```

El seed es idempotente: usa `ON CONFLICT DO NOTHING` y no borra nada si ya hay datos
(el flag `--reset` sí limpia las tablas antes de cargar).

> **Seguridad:** ningún secreto real está versionado (`.env*` está en `.gitignore`).
> Antes de publicar/re-deployar esta rama, configura las variables de entorno con la
> base y credenciales de la demo (nunca las de producción).

## Getting Started

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción
- `npm run lint` — ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment](https://nextjs.org/docs/app/building-your-application/deploying)