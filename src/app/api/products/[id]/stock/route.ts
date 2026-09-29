import { NextRequest, NextResponse } from 'next/server';
import { adjustProductStock } from '@/lib/store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const change = Number(body.change);
    const reason = body.reason || 'Calibración rápida desde Suite de Administración';

    const result = await adjustProductStock(id, change, reason);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Perfume no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: result.product,
      movement: result.movement,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al ajustar inventario' }, { status: 500 });
  }
}
