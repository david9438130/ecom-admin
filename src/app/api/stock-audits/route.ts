import { NextResponse } from 'next/server';
import { getStockMovements } from '@/lib/store';

export async function GET() {
  try {
    const movements = await getStockMovements();
    return NextResponse.json({ success: true, movements });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al recuperar kardex' }, { status: 500 });
  }
}
