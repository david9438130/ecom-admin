export type Role = 'CUSTOMER' | 'ADMIN' | 'SUPERADMIN';

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type StockMovementType = 'SALE_DEDUCTION' | 'MANUAL_RESTOCK' | 'INVENTORY_ADJUSTMENT';

export type PaymentMethod = 'TRANSFERENCIA' | 'YAPE_PLIN' | 'COORDINAR_WSP';

export interface Profile {
  id: string;
  name: string;
  description?: string | null;
  canCatalog: boolean;
  canOrders: boolean;
  canValidatePayments: boolean;
  canKardex: boolean;
  canUsers: boolean;
  canErpExport: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  phone?: string | null;
  role: Role;
  profileId?: string | null;
  profile?: Profile | null;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  localPath?: string | null;
  blobData?: string | null;
  isPrimary: boolean;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  slug: string;
  concentration: string; // e.g. "Extrait de Parfum", "Eau de Parfum", "Elixir"
  olfactiveFamily: string; // e.g. "Oriental & Oud", "Floral Précieux", "Boisé & Cuir"
  description: string;
  price: number;
  retailPrice: number; // Precio de lista retail
  discountPrice?: number | null; // Precio promocional con descuento
  originalPrice?: number; // Compatibilidad retroactiva
  stock: number;
  sku: string;
  image: string;
  volumeMl: number;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  longevity: string;
  sillage: string;
  isFeatured: boolean;
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productBrand: string;
  productConcentration: string;
  price: number;
  quantity: number;
  subtotal: number;
  productImage: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED';
  paymentValidatedBy?: string | null;
  paymentValidatedAt?: string | null;
  paymentMethod: PaymentMethod | string;
  paymentReference?: string;
  customerNotes?: string;
  stockDeducted: boolean;
  erpExported: boolean;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  type: StockMovementType;
  inQuantity: number;
  outQuantity: number;
  changeQuantity: number;
  previousStock: number;
  balance: number;
  newStock: number;
  orderId?: string;
  orderNumber?: string;
  reference?: string | null;
  user?: string | null;
  note?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ManualPaymentDetails {
  bancos: {
    nombre: string;
    titular: string;
    cuentaSoles?: string;
    cciSoles?: string;
    cuentaDolares?: string;
    cciDolares?: string;
  }[];
  billeterasDigitales: {
    nombre: string;
    numero: string;
    titular: string;
  }[];
  whatsappNumero: string;
  whatsappMensajePrefijado: string;
}
