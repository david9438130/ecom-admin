import { NextRequest, NextResponse } from 'next/server';
import { getUsers, updateUserProfile } from '@/lib/store';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error al recuperar usuarios' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, profileId, role } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId es requerido.' }, { status: 400 });
    }

    const updatedUser = await updateUserProfile(userId, profileId ?? null, role);
    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Perfil y permisos de usuario actualizados correctamente.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}
