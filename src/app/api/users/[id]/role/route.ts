import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { role, requesterEmail } = body;

    if (!role || !['CUSTOMER', 'ADMIN', 'SUPERADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
    }

    if (!requesterEmail) {
      return NextResponse.json({ error: 'Identidad del solicitante requerida' }, { status: 401 });
    }

    // 1. Verificar que el solicitante sea SUPERADMIN en PostgreSQL
    const requester = await prisma.user.findUnique({
      where: { email: requesterEmail.trim().toLowerCase() },
    });

    if (!requester || requester.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Permiso denegado. Solo un SUPERADMINISTRADOR puede modificar privilegios de usuarios.' },
        { status: 403 }
      );
    }

    // 2. Modificar rol en PostgreSQL
    const targetUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    // 3. Registrar en bitácora de auditoría
    await prisma.adminAuditLog.create({
      data: {
        userId: requester.id,
        action: 'ROLE_CHANGE',
        resource: `User:${targetUser.email}`,
        details: `Rol de ${targetUser.email} actualizado a ${role} por ${requester.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar rol:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
