import { NextRequest, NextResponse } from 'next/server';
import { getProfiles, createProfile } from '@/lib/store';

export async function GET() {
  try {
    const profiles = await getProfiles();
    return NextResponse.json({ success: true, profiles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      canCatalog = false,
      canOrders = false,
      canValidatePayments = false,
      canKardex = false,
      canUsers = false,
      canErpExport = false,
    } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'El nombre del perfil es obligatorio.' }, { status: 400 });
    }

    const profile = await createProfile({
      name: name.trim(),
      description,
      canCatalog: Boolean(canCatalog),
      canOrders: Boolean(canOrders),
      canValidatePayments: Boolean(canValidatePayments),
      canKardex: Boolean(canKardex),
      canUsers: Boolean(canUsers),
      canErpExport: Boolean(canErpExport),
    });

    return NextResponse.json({ success: true, profile, message: `Perfil "${profile.name}" creado con éxito.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error al crear perfil.' }, { status: 500 });
  }
}
