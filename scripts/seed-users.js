const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample users to PostgreSQL...');

  const users = [
    {
      id: 'usr_superadmin_01',
      name: 'Jean-Luc de Montmirail',
      email: 'superadmin@auraparfums.com',
      role: 'SUPERADMIN',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_admin_01',
      name: 'Alexandre de Mortemart',
      email: 'admin@auraparfums.com',
      role: 'ADMIN',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_customer_vip_01',
      name: 'Victoria de la Vega',
      email: 'v.delavega@vip.maison.com',
      role: 'CUSTOMER',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_customer_corp_02',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@vip.com',
      role: 'CUSTOMER',
      image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        image: u.image,
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        image: u.image,
      },
    });
    console.log(`✓ User created/updated: ${u.email} [${u.role}]`);
  }

  const allUsers = await prisma.user.findMany();
  console.log(`Total users in PostgreSQL: ${allUsers.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
