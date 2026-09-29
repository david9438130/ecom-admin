import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Debe ingresar correo y contraseña.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Buscar usuario en PostgreSQL con su perfil
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Usuario no encontrado en la Maison.' },
        { status: 401 }
      );
    }

    // 2. Verificar que tenga rol de acceso administrativo
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Esta cuenta tiene rol de CLIENTE y no posee credenciales para la Suite de Administración.' },
        { status: 403 }
      );
    }

    // 3. Validar contraseña hasheada con bcrypt
    if (!user.password) {
      return NextResponse.json(
        { error: 'La cuenta no tiene contraseña configurada para acceso administrativo.' },
        { status: 401 }
      );
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta. Verifique sus credenciales de seguridad.' },
        { status: 401 }
      );
    }

    // 4. Registrar auditoría de inicio de sesión exitoso
    try {
      await prisma.adminAuditLog.create({
        data: {
          userId: user.id,
          action: 'ADMIN_LOGIN',
          resource: 'AUTH',
          details: `Inicio de sesión exitoso de ${user.email} con rol ${user.role} y perfil ${user.profile?.name || 'Sin Asignar'}`,
        },
      });
    } catch (auditErr) {
      console.warn('Advertencia en registro de auditoría:', auditErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        phone: user.phone,
        profileId: user.profileId,
        profile: user.profile
          ? {
              id: user.profile.id,
              name: user.profile.name,
              description: user.profile.description,
              canCatalog: user.profile.canCatalog,
              canOrders: user.profile.canOrders,
              canValidatePayments: user.profile.canValidatePayments,
              canKardex: user.profile.canKardex,
              canUsers: user.profile.canUsers,
              canErpExport: user.profile.canErpExport,
            }
          : null,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error en login de administrador:', error);
    return NextResponse.json(
      { error: 'Error interno en el servidor de autenticación', details: error.message },
      { status: 500 }
    );
  }
}
