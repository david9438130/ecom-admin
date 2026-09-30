# 📖 MANUAL TÉCNICO & ARQUITECTURA DEL ECOSISTEMA AURA MAISON DE PARFUM

Este documento describe la arquitectura, credenciales, flujos de seguridad, módulos operativos y la guía para habilitar **Login con Google** de las dos plataformas del ecosistema:
1. **Tienda de Clientes (Storefront - `ecom`)**: Desplegada en `ecom-five-self.vercel.app`.
2. **Suite Administrativa (Admin Suite - `ecom-admin`)**: Desplegada en `ecom-admin-one-theta.vercel.app`.
3. **Base de Datos Cloud**: Supabase PostgreSQL (Región AWS ca-central-1).
4. **Almacenamiento Cloud**: Vercel Blob Storage (`@vercel/blob` modo Private con streaming autorizado).

---

## 🔑 1. CREDENCIALES ACTIVAS EN SUPABASE CLOUD

Ambas cuentas están creadas, activas y con contraseñas encriptadas mediante **bcryptjs** (10 salt rounds) directamente en la base de datos de producción:

| Rol | Correo / Usuario | Contraseña | Alcance y Permisos |
| :--- | :--- | :--- | :--- |
| **SUPERADMIN** | `superadmin@auraparfums.com` | `SuperAdmin9438130!` | **Acceso total**: Gestión de roles, creación de administradores, asignación de perfiles RBAC, validación de pagos, edición de stock, visualización de Kardex y auditoría. |
| **ADMIN** | `admin@auraparfums.com` | `Admin123!` | **Acceso operativo**: Catálogo de productos, validación de comprobantes de pago, despacho de órdenes y consulta de inventario. |

---

## 🛍️ 2. PLATAFORMA 1: TIENDA DE CLIENTES (`ecom`)

### 2.1. Propósito y Experiencia de Usuario
Storefront de lujo para alta perfumería nicho (Extractos de perfume al 35%-38% de concentración). Diseñado con estética clara, acentos verde esmeralda profundo (`#0f4c3a`), tipografía editorial (`Playfair Display` y `Outfit`) y micro-interacciones premium.

### 2.2. Buenas Prácticas de SEO Implementadas
- **Jerarquía Semántica Estricta**: Exactamente **un solo `<h1>` por página** para evitar penalizaciones en Google Search Console.
- **Etiquetas Semánticas**: Uso de `<header>`, `<main>`, `<article>`, `<section>`, y `<footer>`.
- **Metadata Dinámica**: Títulos y descripciones OpenGraph optimizados para compartir en WhatsApp y redes sociales.
- **Optimización de Medios**: Servido con `next/image` y CDN optimizado en formato WebP.

### 2.3. Catálogo & Pirámide Olfativa
Cada perfume almacena en PostgreSQL información detallada:
- **Notas de Salida (Top)**: Percepción inicial fresca (ej: Cardamomo de Ceilán, Azafrán Dorado).
- **Notas de Corazón (Heart)**: El cuerpo de la fragancia (ej: Oud salvaje camboyano, Rosa de Taïf).
- **Notas de Fondo (Base)**: La fijación residual (ej: Ámbar gris, Cuero ahumado, Vainilla bourbon).
- **Concentración, Longevidad y Sillage**.
- **Precios Transparentes**: Precio Retail original tachado, Precio con Descuento promocional y Porcentaje de Ahorro visible.

### 2.4. Flujo de Pedidos y Seguridad en Stock
- **Regla Crítica de Negocio**: Cuando un cliente genera un pedido, **NO se descarga stock de forma prematura**.
- El pedido se registra con estado `PENDING` y `paymentStatus: "PENDING_VALIDATION"`.
- El stock físico solo se deduce en la base de datos cuando un administrador valida el comprobante de pago en el módulo de administración, protegiendo a la tienda de pedidos falsos o cancelados.

---

## 🛡️ 3. PLATAFORMA 2: SUITE ADMINISTRATIVA (`ecom-admin`)

### 3.1. Propósito y Panel Operativo
Plataforma privada diseñada para la gestión empresarial del catálogo, pedidos asistidos, validación de transferencias bancarias, kardex de inventario y seguridad por perfiles.

### 3.2. Módulo de Roles y Perfiles RBAC (`Profile` & `User`)
Permite crear perfiles de trabajo y limitar qué módulos puede ver y editar cada empleado:
- `canCatalog`: Administrar perfumes, precios, notas olfativas y fotos.
- `canOrders`: Ver y gestionar órdenes de compra.
- `canValidatePayments`: Validar pagos y autorizar la deducción de inventario.
- `canKardex`: Auditar los movimientos y saldos contables del Kardex.
- `canUsers`: Crear administradores y asignar perfiles.
- `canErpExport`: Descargar reportes JSON/CSV estructurados para el ERP de la empresa.

### 3.3. Validación de Pagos & Descarga de Stock Sincronizada
- **Ruta de Control**: `/api/orders/[id]/validate-payment`.
- **Acción**: Al hacer clic en "Validar Pago" tras revisar el voucher o número de operación:
  1. La orden cambia a `status: "PAID"` y `paymentStatus: "VALIDATED"`.
  2. Se guarda la trazabilidad: usuario admin que aprobó y marca de tiempo (`paymentValidatedAt`).
  3. Se descuenta el stock de cada producto en una **transacción atómica** de Prisma.
  4. Se crea un asiento oficial en el Kardex con tipo `SALE_DEDUCTION` vinculado al número de pedido.

### 3.4. Kardex Calculado de Inventario
- El saldo **NO es un número estático ni ficticio**: cada movimiento registra:
  - `previousStock`: Saldo anterior en bodega.
  - `inQuantity`: Unidades ingresadas (compras/reposición).
  - `outQuantity`: Unidades egresadas (ventas validadas o mermas).
  - `balance`: Saldo resultante calculado (`previousStock + in - out`).
  - `reference`: Documento de respaldo (N° de Orden, N° de Guía o Factura).
  - `user`: Identidad del administrador que autorizó la operación.

### 3.5. Almacenamiento Multimedia con Vercel Blob (`@vercel/blob`)
- Integrado con la cuenta del usuario (`store_LZzMPTvUsy1DC4Om`).
- Las imágenes de productos y comprobantes se almacenan en Vercel Blob Storage de forma privada y segura.
- Se sirven mediante streaming protegido a través de `/api/blob?pathname=...` y `/api/upload`.

---

## 🌐 4. GUÍA PASO A PASO: CÓMO ACTIVAR EL LOGIN CON GOOGLE

El sistema ya tiene el proveedor de Google integrado en [`src/lib/auth.ts`](file:///c:/Users/DAVID/.gemini/antigravity-ide/ecom/src/lib/auth.ts) mediante `NextAuth`. Para activarlo, solo necesitas obtener tus credenciales de Google y colocarlas en tus variables de entorno.

### Paso 1: Ir a Google Cloud Console
1. Ingresa a: [Google Cloud Console](https://console.cloud.google.com/).
2. Inicia sesión con tu cuenta de Google.
3. En la barra superior, crea un nuevo proyecto (ejemplo: `Aura Maison E-Commerce`).

### Paso 2: Configurar la Pantalla de Consentimiento OAuth
1. En el menú lateral izquierdo, ve a **APIs & Services** ➔ **OAuth consent screen** (Pantalla de consentimiento).
2. Selecciona **External** (Externo) y dale a **Create**.
3. Completa los datos básicos:
   - **App name**: `Aura Maison de Parfum`
   - **User support email**: Tu correo de contacto.
   - **Developer contact information**: Tu correo.
4. En **Scopes** (Permisos), dale a "Save and Continue" (con los permisos básicos de `userinfo.email` y `userinfo.profile` por defecto es suficiente).
5. En **Test users** (si está en modo prueba), agrega tu correo personal para poder probar el login.

### Paso 3: Crear las Credenciales OAuth 2.0
1. En el menú lateral, ve a **APIs & Services** ➔ **Credentials**.
2. Arriba haz clic en **+ CREATE CREDENTIALS** ➔ **OAuth client ID**.
3. En **Application type**, selecciona **Web application**.
4. En **Name**, escribe: `Aura Storefront Client`.
5. En **Authorized JavaScript origins** (Orígenes de JavaScript autorizados), añade:
   - `http://localhost:3000` (para tus pruebas locales)
   - `https://ecom-five-self.vercel.app` (tu URL de producción en Vercel)
6. En **Authorized redirect URIs** (URIs de redireccionamiento autorizados), añade **EXACTAMENTE** estas rutas:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://ecom-five-self.vercel.app/api/auth/callback/google`
   *(Si más adelante le pones un dominio propio como `https://tudominio.com`, agregas `https://tudominio.com/api/auth/callback/google`)*.
7. Haz clic en **Create**.
8. Te aparecerá una ventana con:
   - **Client ID** (ej: `123456789-abcdef.apps.googleusercontent.com`)
   - **Client Secret** (ej: `GOCSPX-abc123xyz...`)

### Paso 4: Agregar las credenciales a las Variables de Entorno
1. **En tu archivo `.env` local**:
   ```env
   GOOGLE_CLIENT_ID="pega_aqui_tu_client_id"
   GOOGLE_CLIENT_SECRET="pega_aqui_tu_client_secret"
   ```
2. **En Vercel (Proyecto `ecom`)**:
   - Ve a **Settings** ➔ **Environment Variables**.
   - Agrega `GOOGLE_CLIENT_ID` con su valor.
   - Agrega `GOOGLE_CLIENT_SECRET` con su valor.
   - Guarda los cambios.

¡Listo! Con esos 4 pasos, el botón "Continuar con Google" de la tienda autenticará automáticamente a los clientes y registrará su perfil en la base de datos de Supabase.

---

## 📁 5. MAPA DE ARCHIVOS CLAVE DEL SISTEMA

```
ecom/                                      # Tienda de Clientes
├── prisma/schema.prisma                   # Modelos de PostgreSQL (Supabase)
├── src/lib/auth.ts                        # Configuración NextAuth + Google OAuth
├── src/app/api/checkout/route.ts          # Creación de orden (Stock retenido hasta pago)
├── src/app/api/orders/[id]/route.ts       # Detalle de orden con ítems y fotos
├── src/app/api/blob/route.ts              # Proxy seguro para Vercel Blob
└── .env.admin.production                  # Variables de entorno verificadas para Vercel

ecom/ecom - administrador/                 # Suite Administrativa
├── src/components/AdminLogin.tsx          # Pantalla de acceso privado (bcrypt)
├── src/components/ImageUploader.tsx       # Subida de fotos hacia Vercel Blob
├── src/app/api/auth/login/route.ts        # Autenticación de Superadmin y Admins
├── src/app/api/orders/[id]/validate-payment/route.ts # Validación de pago + Deducción de Kardex
├── src/app/api/stock-audits/route.ts      # Consulta cronológica del Kardex
└── src/app/api/profiles/route.ts          # Gestión de perfiles y permisos RBAC
```
