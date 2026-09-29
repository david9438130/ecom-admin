import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createManualOrder } from '@/lib/store';

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al recuperar pedidos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createManualOrder(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      message: 'Pedido manual generado y stock descontado en PostgreSQL.',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al registrar pedido manual' }, { status: 500 });
  }
}
