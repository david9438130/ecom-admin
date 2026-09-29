import { NextRequest, NextResponse } from 'next/server';
import { updateProfile, deleteProfile } from '@/lib/store';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateProfile(id, body);
    return NextResponse.json({ success: true, profile: updated, message: 'Perfil actualizado correctamente.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteProfile(id);
    return NextResponse.json({ success: true, message: 'Perfil eliminado correctamente.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
