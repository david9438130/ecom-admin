import { NextRequest, NextResponse } from 'next/server';
import { validateOrderPayment } from '@/lib/store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validatedBy = body.validatedBy || 'superadmin@auraparfums.com';

    const result = await validateOrderPayment(id, validatedBy);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Error al validar el pago del pedido.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      message: `Pago validado correctamente por ${validatedBy}. Stock de almacén descargado e insertado en el Kardex.`,
    });
  } catch (error: any) {
    console.error('Error in validate-payment API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
