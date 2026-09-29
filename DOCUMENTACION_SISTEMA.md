# 🌟 AURA MAISON DE PARFUM — DOCUMENTACIÓN TÉCNICA Y ESTRATÉGICA

Plataforma de comercio electrónico de alta gama para **Perfumería de Nicho y Extractos Puros**, desarrollada con **Next.js 16 (App Router)**, **PostgreSQL local (Prisma ORM)**, autenticación con **Google OAuth (NextAuth)**, **descuento automático de inventario**, **métodos de pago directos (Transferencia Bancaria, Yape / Plin)**, **atención VIP por WhatsApp** y **desacoplamiento total para facturación externa**.

---

## 🏛️ 1. Resumen Ejecutivo y Enfoque de Diseño

- **Estética de Lujo ("Colores Caros")**:
  - Paleta cromática: *Deep Obsidian* (`#09090b`), *Black Onyx*, *Brushed Champagne Gold* (`#d4af37`), acentos ámbar y paneles con efecto de cristal ahumado (*glassmorphism*).
  - Tipografía editorial: `Playfair Display` (Serif de alta costura) y `Outfit` (Sans-serif refinada).
  - Ficha olfativa interactiva: Visualización detallada de la **Pirámide Olfativa** (Notas de Salida, Corazón y Fondo), fijación (*longevity*), estela (*sillage*) y concentración de extracto al 35%-38%.
  - **Experiencia de Compra Asistida**: En el sector de perfumes de ultra-lujo, la compra asistida por WhatsApp genera mayor confianza que una pasarela fría, permitiendo atención personalizada y validación de transferencias directas.

---

## 🛠️ 2. Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Frontend & SSR** | Next.js 16 (App Router) + TypeScript | Renderizado híbrido ultra-rápido y SEO optimizado |
| **Estilos & Diseño** | Tailwind CSS v4 + Variables CSS personalizadas | Glassmorphism, gradientes oro y micro-animaciones |
| **Base de Datos** | **PostgreSQL Local + Prisma ORM** | Base de datos relacional conectada en `localhost:5432` con esquema sincronizado |
| **Autenticación** | NextAuth.js + Google OAuth | Inicio de sesión con cuenta Google y selector de roles (`ADMIN` / `CUSTOMER`) |
| **Métodos de Pago** | **Directos (Sin Pasarela)** | Transferencias BCP, BBVA, Interbank, Yape y Plin sin comisiones |
| **Canal de Venta** | **WhatsApp Concierge Integrado** | Botón flotante y redirección automática con datos del pedido pre-llenados |
| **Inventario** | Motor de descuento atómico de stock | Validación previa y rebaja inmediata en PostgreSQL al generar el pedido |
| **Facturación** | Desacoplada (Exportador a ERP / SUNAT) | No genera facturas locales; emite payload estandarizado para sistema contable |

---

## 🐘 3. Conexión a Base de Datos PostgreSQL Local

El sistema está configurado y conectado directamente a su instancia local de PostgreSQL:

### 3.1. Cadena de Conexión (`.env` y `.env.local`)
```env
DATABASE_URL="postgresql://postgres:9438130@localhost:5432/aura_parfums?schema=public"
```

### 3.2. Sincronización del Esquema Prisma
Para aplicar cualquier cambio futuro en los modelos de base de datos:
```bash
npx prisma db push
```

### 3.3. Modelos Registrados en PostgreSQL:
- `Product`: Catálogo de perfumes con notas olfativas, SKU, concentración y stock disponible.
- `Order`: Registro de cada pedido generado con datos de despacho, total y método de pago (`TRANSFERENCIA`, `YAPE_PLIN`, `COORDINAR_WSP`).
- `OrderItem`: Desglose de cada frasco adquirido con precio unitario y cantidad.
- `StockMovement` (Kardex): Historial inmutable de cada descuento (`SALE_DEDUCTION`) y reabastecimiento (`MANUAL_RESTOCK`).
- `User`: Usuarios con roles de cliente y administrador.

---

## 📲 4. Flujo de Pedido, Pagos Directos y WhatsApp VIP

Se ha eliminado la pasarela de pagos para dar paso a un modelo directo, elegante y sin fricciones:

### 4.1. Métodos de Pago Disponibles:
1. **Transferencia Bancaria Inmediata**:
   - **BCP**: Cuenta Dólares `194-9842104-1-88` (CCI: `002-194009842104188-92`)
   - **BBVA**: Cuenta Dólares `0011-0175-0100084920` (CCI: `011-175-000100084920-74`)
   - **Interbank**: Cuenta Dólares `200-3001849201` (CCI: `003-200-003001849201-38`)
   - Botón de **"Copiar"** de un clic para números de cuenta y CCI.
2. **Billeteras Digitales (Yape / Plin)**:
   - Número oficial: `987 654 321` (Titular: AURA MAISON).
3. **Coordinación Directa por WhatsApp**:
   - Atención personalizada para acordar el pago y la entrega.

### 4.2. Flujo Completo:
```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente VIP
    participant Web as Checkout Next.js
    participant API as /api/checkout
    participant DB as PostgreSQL (Local)
    participant WSP as WhatsApp Concierge

    Cliente->>Web: Selecciona método (Transferencia / Yape / WhatsApp) e ingresa dirección
    Cliente->>Web: Presiona "Confirmar Pedido"
    Web->>API: Envía cliente, dirección, ítems y método
    API->>DB: Verifica existencia de stock de cada perfume
    API->>DB: Crea Orden con estado PENDING
    API->>DB: Descuenta stock (-X) y registra StockMovement
    API-->>Web: Confirmación 200 con Order ID y enlace WhatsApp pre-llenado
    Web-->>Cliente: Redirige a /checkout/success
    Cliente->>WSP: Presiona "Enviar Pedido a WhatsApp"
    Note over Cliente,WSP: Abre chat con mensaje formal y detalle de la orden
```

---

## 📦 5. Gestión de Inventario y Auditoría (Kardex)

- **Descuento Atómico**: El stock se rebaja en PostgreSQL al instante de generar el pedido:
  $$\text{Nuevo Stock} = \text{Stock Anterior} - \text{Cantidad Solicitada}$$
- **Protección contra Sobreventa**: Si las unidades solicitadas superan el stock actual, el sistema rechaza la orden y avisa al cliente cuántas unidades quedan disponibles.
- **Kardex en Tiempo Real**: En el panel `/admin` (Pestaña 3), el administrador puede auditar cada salida por venta con fecha, hora exacta, perfume y número de orden.

---

## 🧾 6. Desacoplamiento de Facturación (Integración ERP)

La tienda **no emite comprobantes tributarios internos**, cumpliendo su requerimiento de facturar en otro sistema:
- Cada pedido se registra comercialmente.
- Expone el botón **"Ficha del Pedido para Facturación Externa (ERP)"** en la página de éxito y en el panel administrativo.
- Descarga un archivo JSON estructurado (UBL 2.1) con Base Imponible, IGV (18%), SKU y datos del cliente, marcado con el flag `STOCK_ALREADY_DEDUCTED_BY_ECOMMERCE` para evitar duplicar el descuento en el sistema contable.

---

## 👑 7. Panel de Control de Administración (`/admin`)

- **KPIs en Vivo**: Total recaudado en pedidos, cantidad de órdenes generadas, frascos totales en bodega y alertas de inventario bajo.
- **Gestor de Perfumes**: Alta de nuevos perfumes, subida de frascos, precios y composición de notas olfativas.
- **Ajustador Rápido de Stock**: Botones `+1`, `-1` y `+5` directos en la tabla para calibrar el stock en PostgreSQL sin recargar la página.
- **Gestor de Pedidos**: Listado de clientes, montos, método elegido y botón directo **"Chat WhatsApp"** para responder al cliente.
- **Kardex**: Historial de movimientos de inventario.

---

## 🚀 8. Puesta en Marcha

```bash
# 1. El servidor ya está corriendo en:
http://localhost:3000

# 2. Rutas disponibles:
# Tienda Principal: http://localhost:3000
# Panel de Control: http://localhost:3000/admin
# Checkout Directo: http://localhost:3000/checkout
```
