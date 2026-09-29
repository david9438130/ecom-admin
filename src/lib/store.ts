import { prisma } from './prisma';
import { Product, Order, StockMovement, User, Profile } from './types';

// ==========================================
// PRODUCTOS
// ==========================================

export async function getProducts(): Promise<Product[]> {
  const items = await prisma.product.findMany({
    include: {
      images: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return items.map((p) => ({
    ...p,
    retailPrice: p.retailPrice,
    discountPrice: p.discountPrice ?? undefined,
    originalPrice: p.retailPrice,
    images: p.images.map((img) => ({
      id: img.id,
      productId: img.productId,
      url: img.url,
      localPath: img.localPath ?? undefined,
      blobData: img.blobData ?? undefined,
      isPrimary: img.isPrimary,
      order: img.order,
    })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, actorUser = 'superadmin@auraparfums.com'): Promise<Product> {
  const effectivePrice = data.discountPrice && data.discountPrice > 0 ? data.discountPrice : data.retailPrice;

  const created = await prisma.product.create({
    data: {
      name: data.name,
      brand: data.brand,
      slug: data.slug,
      concentration: data.concentration,
      olfactiveFamily: data.olfactiveFamily,
      description: data.description,
      retailPrice: data.retailPrice,
      discountPrice: data.discountPrice ?? null,
      price: effectivePrice,
      stock: data.stock,
      sku: data.sku,
      image: data.image,
      volumeMl: data.volumeMl,
      notesTop: data.notesTop,
      notesHeart: data.notesHeart,
      notesBase: data.notesBase,
      longevity: data.longevity,
      sillage: data.sillage,
      isFeatured: data.isFeatured,
    },
  });

  if (data.images && data.images.length > 0) {
    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      await prisma.productImage.create({
        data: {
          productId: created.id,
          url: img.url,
          localPath: img.localPath || `C:\\ecom-storage\\uploads\\${img.url.split('/').pop()}`,
          blobData: img.blobData || null,
          isPrimary: img.isPrimary ?? (i === 0),
          order: img.order ?? (i + 1),
        },
      });
    }
  } else if (data.image) {
    await prisma.productImage.create({
      data: {
        productId: created.id,
        url: data.image,
        localPath: `C:\\ecom-storage\\uploads\\${data.image.split('/').pop()}`,
        isPrimary: true,
        order: 1,
      },
    });
  }

  // Kardex: Registro calculado de inventario inicial
  if (created.stock > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: created.id,
        type: 'MANUAL_RESTOCK',
        inQuantity: created.stock,
        outQuantity: 0,
        changeQuantity: created.stock,
        previousStock: 0,
        balance: created.stock,
        newStock: created.stock,
        reference: `INV-ALTA-${created.sku}`,
        user: actorUser,
        note: `Ingreso inicial registrado en catálogo (${created.stock} unidades)`,
      },
    });
  }

  const fetched = await prisma.product.findUnique({
    where: { id: created.id },
    include: { images: true },
  });

  return {
    ...created,
    retailPrice: created.retailPrice,
    discountPrice: created.discountPrice,
    originalPrice: created.retailPrice,
    images: (fetched?.images || []).map((img) => ({
      id: img.id,
      productId: img.productId,
      url: img.url,
      localPath: img.localPath,
      blobData: img.blobData,
      isPrimary: img.isPrimary,
      order: img.order,
    })),
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateProduct(id: string, data: Partial<Product>, actorUser = 'superadmin@auraparfums.com'): Promise<Product | null> {
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) return null;

  const oldStock = current.stock;
  const newStock = typeof data.stock === 'number' ? data.stock : oldStock;

  const retailPrice = typeof data.retailPrice === 'number' ? data.retailPrice : current.retailPrice;
  const discountPrice = typeof data.discountPrice !== 'undefined' ? data.discountPrice : current.discountPrice;
  const effectivePrice = discountPrice && discountPrice > 0 ? discountPrice : retailPrice;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      brand: data.brand,
      retailPrice,
      discountPrice,
      price: effectivePrice,
      stock: newStock,
      concentration: data.concentration,
      olfactiveFamily: data.olfactiveFamily,
      description: data.description,
      notesTop: data.notesTop,
      notesHeart: data.notesHeart,
      notesBase: data.notesBase,
      image: data.image,
    },
  });

  if (data.images && data.images.length > 0) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      await prisma.productImage.create({
        data: {
          productId: id,
          url: img.url,
          localPath: img.localPath || `C:\\ecom-storage\\uploads\\${img.url.split('/').pop()}`,
          blobData: img.blobData || null,
          isPrimary: img.isPrimary ?? (i === 0),
          order: img.order ?? (i + 1),
        },
      });
    }
  }

  // Kardex: Registro calculado de ajuste
  if (oldStock !== newStock) {
    const diff = newStock - oldStock;
    const inQty = diff > 0 ? diff : 0;
    const outQty = diff < 0 ? Math.abs(diff) : 0;

    await prisma.stockMovement.create({
      data: {
        productId: id,
        type: diff > 0 ? 'MANUAL_RESTOCK' : 'INVENTORY_ADJUSTMENT',
        inQuantity: inQty,
        outQuantity: outQty,
        changeQuantity: diff,
        previousStock: oldStock,
        balance: newStock,
        newStock: newStock,
        reference: `CALIB-${Date.now().toString().slice(-6)}`,
        user: actorUser,
        note: `Calibración desde Suite de Administración (${diff > 0 ? '+' : ''}${diff} ud.)`,
      },
    });
  }

  const fetched = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  return {
    ...updated,
    retailPrice: updated.retailPrice,
    discountPrice: updated.discountPrice,
    originalPrice: updated.retailPrice,
    images: (fetched?.images || []).map((img) => ({
      id: img.id,
      productId: img.productId,
      url: img.url,
      localPath: img.localPath,
      blobData: img.blobData,
      isPrimary: img.isPrimary,
      order: img.order,
    })),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function adjustProductStock(
  productId: string,
  quantityChange: number,
  reason: string,
  actorUser = 'superadmin@auraparfums.com'
): Promise<{ product: Product; movement: StockMovement } | null> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return null;

  const previousStock = product.stock;
  const newStock = Math.max(0, previousStock + quantityChange);
  const actualDiff = newStock - previousStock;

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: { stock: newStock },
  });

  const inQty = actualDiff > 0 ? actualDiff : 0;
  const outQty = actualDiff < 0 ? Math.abs(actualDiff) : 0;

  const movement = await prisma.stockMovement.create({
    data: {
      productId: productId,
      type: actualDiff >= 0 ? 'MANUAL_RESTOCK' : 'INVENTORY_ADJUSTMENT',
      inQuantity: inQty,
      outQuantity: outQty,
      changeQuantity: actualDiff,
      previousStock,
      balance: newStock,
      newStock,
      reference: `AJUSTE-${Date.now().toString().slice(-6)}`,
      user: actorUser,
      note: reason || 'Ajuste rápido desde Suite de Administración',
    },
  });

  return {
    product: {
      ...updatedProduct,
      retailPrice: updatedProduct.retailPrice,
      discountPrice: updatedProduct.discountPrice,
      originalPrice: updatedProduct.retailPrice,
      createdAt: updatedProduct.createdAt.toISOString(),
      updatedAt: updatedProduct.updatedAt.toISOString(),
    },
    movement: {
      ...movement,
      productName: updatedProduct.name,
      orderId: movement.orderId ?? undefined,
      reference: movement.reference ?? undefined,
      user: movement.user ?? undefined,
      note: movement.note ?? undefined,
      createdAt: movement.createdAt.toISOString(),
    },
  };
}

export async function deleteProduct(id: string): Promise<boolean> {
  await prisma.product.delete({ where: { id } });
  return true;
}

// ==========================================
// PEDIDOS Y VALIDACIÓN DE PAGO
// ==========================================

export async function getOrders(): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((o) => ({
    ...o,
    paymentStatus: o.paymentStatus as any,
    paymentValidatedBy: o.paymentValidatedBy ?? undefined,
    paymentValidatedAt: o.paymentValidatedAt ? o.paymentValidatedAt.toISOString() : undefined,
    paymentReference: o.paymentReference ?? undefined,
    customerNotes: o.customerNotes ?? undefined,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((it) => ({
      ...it,
      productId: it.productId || '',
    })),
  }));
}

/**
 * Validar Pago y Descargar Stock (Kardex Calculado)
 */
export async function validateOrderPayment(
  orderId: string,
  validatedBy: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: 'Pedido no encontrado en el sistema.' };
    }

    if (order.stockDeducted || order.paymentStatus === 'VALIDATED') {
      return {
        success: false,
        error: `El pedido #${order.orderNumber} ya se encuentra con pago validado y stock descargado.`,
      };
    }

    // Verificar existencias antes de la descarga
    for (const it of order.items) {
      if (!it.productId) continue;
      const p = await prisma.product.findUnique({ where: { id: it.productId } });
      if (!p) {
        return { success: false, error: `El producto "${it.productName}" no fue hallado en el catálogo.` };
      }
      if (p.stock < it.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para autorizar descarga: "${p.name}" tiene ${p.stock} ud. y la orden requiere ${it.quantity} ud.`,
        };
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Descargar stock y registrar Kardex secuencial
      for (const it of order.items) {
        if (!it.productId) continue;
        const currentProd = await tx.product.findUnique({ where: { id: it.productId } });
        if (!currentProd) continue;

        const prevStock = currentProd.stock;
        const newStock = prevStock - it.quantity;

        // Actualizar stock del producto
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: newStock },
        });

        // Registrar movimiento de Kardex calculado
        await tx.stockMovement.create({
          data: {
            productId: it.productId,
            type: 'SALE_DEDUCTION',
            inQuantity: 0,
            outQuantity: it.quantity,
            changeQuantity: -it.quantity,
            previousStock: prevStock,
            balance: newStock,
            newStock: newStock,
            orderId: order.id,
            reference: `Pedido #${order.orderNumber}`,
            user: validatedBy,
            note: `Validación de comprobante aprobada por ${validatedBy}. Salida física de ${it.quantity} ud.`,
          },
        });
      }

      // 2. Actualizar estado del pedido a PAID y VALIDATED
      const orderValidated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'VALIDATED',
          stockDeducted: true,
          paymentValidatedBy: validatedBy,
          paymentValidatedAt: new Date(),
        },
        include: { items: true },
      });

      // 3. Log de auditoría
      const adminUser = await tx.user.findFirst({ where: { email: validatedBy } });
      if (adminUser) {
        await tx.adminAuditLog.create({
          data: {
            userId: adminUser.id,
            action: 'VALIDATE_PAYMENT',
            resource: `Order #${order.orderNumber}`,
            details: `Validación autorizada por ${validatedBy}. Descuento de stock en almacén aplicado.`,
          },
        });
      }

      return orderValidated;
    });

    return {
      success: true,
      order: {
        ...updated,
        paymentStatus: 'VALIDATED',
        paymentValidatedBy: updated.paymentValidatedBy ?? undefined,
        paymentValidatedAt: updated.paymentValidatedAt ? updated.paymentValidatedAt.toISOString() : undefined,
        paymentReference: updated.paymentReference ?? undefined,
        customerNotes: updated.customerNotes ?? undefined,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        items: updated.items.map((it) => ({
          ...it,
          productId: it.productId || '',
        })),
      },
    };
  } catch (err: any) {
    console.error('Error validando pago:', err);
    return { success: false, error: err.message || 'Error al validar el pago.' };
  }
}

/**
 * Pedido Manual creado directamente por un Operador/Admin
 */
export async function createManualOrder(params: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingCity: string;
  paymentMethod: string;
  customerNotes?: string;
  creatorUser?: string;
  autoValidatePayment?: boolean;
  items: { productId: string; quantity: number }[];
}): Promise<{ success: boolean; order?: Order; error?: string }> {
  const productIds = params.items.map((i) => i.productId);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  let calculatedTotal = 0;
  const orderItemsData: any[] = [];

  for (const item of params.items) {
    const prod = dbProducts.find((p) => p.id === item.productId);
    if (!prod) return { success: false, error: 'Producto no encontrado' };
    if (prod.stock < item.quantity) {
      return {
        success: false,
        error: `Stock insuficiente para "${prod.name}". Solicitado: ${item.quantity}, Disponible: ${prod.stock}`,
      };
    }

    const subtotal = prod.price * item.quantity;
    calculatedTotal += subtotal;

    orderItemsData.push({
      productId: prod.id,
      productName: prod.name,
      productBrand: prod.brand,
      productConcentration: prod.concentration,
      price: prod.price,
      quantity: item.quantity,
      subtotal,
      productImage: prod.image,
    });
  }

  const orderNumber = `AUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const shouldValidate = params.autoValidatePayment ?? false;

  const resultOrder = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        customerName: params.customerName,
        customerEmail: params.customerEmail || 'venta.asistida@auraparfums.com',
        customerPhone: params.customerPhone,
        shippingAddress: params.shippingAddress,
        shippingCity: params.shippingCity,
        totalAmount: calculatedTotal,
        currency: 'USD',
        status: shouldValidate ? 'PAID' : 'PENDING',
        paymentStatus: shouldValidate ? 'VALIDATED' : 'PENDING_VALIDATION',
        paymentValidatedBy: shouldValidate ? (params.creatorUser || 'admin') : null,
        paymentValidatedAt: shouldValidate ? new Date() : null,
        paymentMethod: params.paymentMethod,
        customerNotes: params.customerNotes || 'Pedido asistido generado por Administrador',
        stockDeducted: shouldValidate,
        erpExported: false,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    if (shouldValidate) {
      for (const item of params.items) {
        const currentProd = dbProducts.find((p) => p.id === item.productId)!;
        const prevStock = currentProd.stock;
        const newStock = prevStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE_DEDUCTION',
            inQuantity: 0,
            outQuantity: item.quantity,
            changeQuantity: -item.quantity,
            previousStock: prevStock,
            balance: newStock,
            newStock: newStock,
            orderId: newOrder.id,
            reference: `Pedido #${newOrder.orderNumber}`,
            user: params.creatorUser || 'admin',
            note: `Venta directa en tienda por ${params.creatorUser || 'admin'} (${item.quantity} ud.)`,
          },
        });
      }
    }

    return newOrder;
  });

  return {
    success: true,
    order: {
      ...resultOrder,
      paymentStatus: resultOrder.paymentStatus as any,
      paymentValidatedBy: resultOrder.paymentValidatedBy ?? undefined,
      paymentValidatedAt: resultOrder.paymentValidatedAt ? resultOrder.paymentValidatedAt.toISOString() : undefined,
      paymentReference: resultOrder.paymentReference ?? undefined,
      customerNotes: resultOrder.customerNotes ?? undefined,
      createdAt: resultOrder.createdAt.toISOString(),
      updatedAt: resultOrder.updatedAt.toISOString(),
      items: resultOrder.items.map((it) => ({
        ...it,
        productId: it.productId || '',
      })),
    },
  };
}

// ==========================================
// KARDEX SECUENCIAL CALCULADO
// ==========================================

export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  const where: any = {};
  if (productId) where.productId = productId;

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: { select: { name: true, sku: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return movements.map((m) => ({
    id: m.id,
    productId: m.productId,
    productName: m.product.name,
    productSku: m.product.sku,
    type: m.type as any,
    inQuantity: m.inQuantity,
    outQuantity: m.outQuantity,
    changeQuantity: m.changeQuantity,
    previousStock: m.previousStock,
    balance: m.balance,
    newStock: m.newStock,
    orderId: m.orderId ?? undefined,
    orderNumber: m.order?.orderNumber,
    reference: m.reference ?? undefined,
    user: m.user ?? undefined,
    note: m.note ?? undefined,
    createdAt: m.createdAt.toISOString(),
  }));
}

// ==========================================
// PERFILES Y CONTROL DE ACCESO (RBAC)
// ==========================================

export async function getProfiles(): Promise<Profile[]> {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return profiles.map((p) => ({
    ...p,
    description: p.description ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function createProfile(data: {
  name: string;
  description?: string;
  canCatalog: boolean;
  canOrders: boolean;
  canValidatePayments: boolean;
  canKardex: boolean;
  canUsers: boolean;
  canErpExport: boolean;
}): Promise<Profile> {
  const created = await prisma.profile.create({
    data: {
      name: data.name,
      description: data.description,
      canCatalog: data.canCatalog,
      canOrders: data.canOrders,
      canValidatePayments: data.canValidatePayments,
      canKardex: data.canKardex,
      canUsers: data.canUsers,
      canErpExport: data.canErpExport,
    },
  });

  return {
    ...created,
    description: created.description ?? undefined,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateProfile(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    canCatalog: boolean;
    canOrders: boolean;
    canValidatePayments: boolean;
    canKardex: boolean;
    canUsers: boolean;
    canErpExport: boolean;
  }>
): Promise<Profile> {
  const updated = await prisma.profile.update({
    where: { id },
    data,
  });

  return {
    ...updated,
    description: updated.description ?? undefined,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteProfile(id: string): Promise<boolean> {
  await prisma.profile.delete({ where: { id } });
  return true;
}

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role as any,
    profileId: u.profileId ?? undefined,
    profile: u.profile
      ? {
          ...u.profile,
          description: u.profile.description ?? undefined,
          createdAt: u.profile.createdAt.toISOString(),
          updatedAt: u.profile.updatedAt.toISOString(),
        }
      : null,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function updateUserProfile(
  userId: string,
  profileId: string | null,
  role?: 'CUSTOMER' | 'ADMIN' | 'SUPERADMIN'
): Promise<User> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      profileId: profileId || null,
      ...(role ? { role } : {}),
    },
    include: { profile: true },
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    image: updated.image,
    role: updated.role as any,
    profileId: updated.profileId ?? undefined,
    profile: updated.profile
      ? {
          ...updated.profile,
          description: updated.profile.description ?? undefined,
          createdAt: updated.profile.createdAt.toISOString(),
          updatedAt: updated.profile.updatedAt.toISOString(),
        }
      : null,
    createdAt: updated.createdAt.toISOString(),
  };
}
