import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role = 'ADMIN', phone, requesterEmail, profileId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, correo y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'SUPERADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Rol administrativo inválido' }, { status: 400 });
    }

    // 1. Verificar que el solicitante sea SUPERADMIN
    if (!requesterEmail) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({
      where: { email: requesterEmail.trim().toLowerCase() },
    });

    if (!requester || requester.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Permiso denegado. Solo un SUPERADMINISTRADOR puede crear nuevas cuentas de administración.' },
        { status: 403 }
      );
    }

    // 2. Verificar que no exista el correo
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este correo electrónico.' },
        { status: 400 }
      );
    }

    // 3. Hashear contraseña con bcrypt
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 4. Crear usuario en PostgreSQL con perfil asignado
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role as any,
        phone: phone || null,
        profileId: profileId || null,
        image: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      },
      include: { profile: true },
    });

    // 5. Registrar en auditoría
    await prisma.adminAuditLog.create({
      data: {
        userId: requester.id,
        action: 'CREATE_ADMIN',
        resource: `User:${newAdmin.email}`,
        details: `Nuevo ${role} ${newAdmin.email} creado por ${requester.email} con perfil ${newAdmin.profile?.name || 'General'}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        profileId: newAdmin.profileId,
        profile: newAdmin.profile,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error al crear administrador:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
