import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    await prisma.order.update({
      where: { id },
      data: { erpExported: true },
    });

    const subtotalNet = Number((order.totalAmount / 1.18).toFixed(2));
    const igvTax = Number((order.totalAmount - subtotalNet).toFixed(2));

    const payload = {
      invoicingVersion: '2.1-UBL-SUNAT',
      originSystem: 'AURA_ADMIN_SUITE',
      externalReferenceId: order.orderNumber,
      systemOrderId: order.id,
      transactionDate: order.createdAt,
      customer: {
        fullName: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        deliveryAddress: order.shippingAddress,
        city: order.shippingCity,
        taxId: 'CONSUMIDOR_FINAL_O_RUC',
      },
      paymentDetails: {
        method: order.paymentMethod,
        currency: order.currency,
        status: order.status,
      },
      financials: {
        subtotalNet,
        igvTax,
        totalAmount: order.totalAmount,
      },
      items: order.items.map((it) => ({
        description: `${it.productBrand} - ${it.productName}`,
        unitPrice: it.price,
        quantity: it.quantity,
        lineTotal: it.subtotal,
      })),
      stockStatus: 'STOCK_ALREADY_DEDUCTED_BY_ECOMMERCE',
    };

    return NextResponse.json({ success: true, erpPayload: payload });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al exportar a ERP' }, { status: 500 });
  }
}
