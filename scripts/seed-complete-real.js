const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING REAL DATA INTO POSTGRESQL (AURA PARFUMS) ---');

  // 1. Passwords hasheadas con bcryptjs
  const superAdminPassHash = bcrypt.hashSync('SuperAdmin9438130!', 10);
  const adminPassHash = bcrypt.hashSync('Admin123!', 10);

  // 2. Usuarios Reales
  const users = [
    {
      id: 'usr_superadmin_01',
      name: 'Jean-Luc de Montmirail',
      email: 'superadmin@auraparfums.com',
      password: superAdminPassHash,
      phone: '+51 987 654 321',
      role: 'SUPERADMIN',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_admin_01',
      name: 'Alexandre de Mortemart',
      email: 'admin@auraparfums.com',
      password: adminPassHash,
      phone: '+51 912 345 678',
      role: 'ADMIN',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  ];

  // Limpiar usuarios antiguos para evitar colisiones de IDs
  await prisma.user.deleteMany({});
  
  for (const u of users) {
    await prisma.user.create({
      data: u,
    });
    console.log(`✓ Usuario Real: ${u.email} [${u.role}] sincronizado.`);
  }

  // 3. Productos Reales con Precios Retail, Descuento y Múltiples Imágenes
  const products = [
    {
      id: 'prod_oud_royal_01',
      name: 'Oud Royal Impérial',
      brand: 'Aura Niche',
      slug: 'oud-royal-imperial',
      concentration: 'Extrait de Parfum (38%)',
      olfactiveFamily: 'Oriental & Boisé Majestueux',
      description: 'Una creación opulenta basada en el Oud salvaje de Camboya añejado en barricas de roble durante 12 años, coronado por cardamomo verde y humo de incienso de Omán.',
      retailPrice: 420.0,
      discountPrice: 365.0,
      price: 365.0,
      stock: 14,
      sku: 'AURA-OUD-001',
      image: '/images/perfumes/oud-royal.jpg',
      volumeMl: 100,
      notesTop: 'Cardamomo de Ceilán, Azafrán Dorado, Bergamota de Calabria',
      notesHeart: 'Oud Camboyano Silvestre, Rosa de Mayo, Resina de Incienso Real',
      notesBase: 'Ámbar Gris Marino, Cuero Ahumado, Vetiver de Madagascar',
      longevity: '14+ Horas (Ultra-fijación)',
      sillage: 'Pesado & Envolvente',
      isFeatured: true,
      images: [
        { url: '/images/perfumes/oud-royal.jpg', isPrimary: true, order: 1 },
        { url: '/images/perfumes/cuir-imperial.jpg', isPrimary: false, order: 2 },
      ],
    },
    {
      id: 'prod_rose_noire_02',
      name: 'Rose Noir de Taïf',
      brand: 'Aura Niche',
      slug: 'rose-noir-de-taif',
      concentration: 'Extrait de Parfum (35%)',
      olfactiveFamily: 'Floral Sombre & Ambré',
      description: 'Rosa de Taïf cosechada a mano al amanecer en las montañas árabes, envuelta en velos de pachulí negro húmedo y vainilla bourbon ahumada.',
      retailPrice: 380.0,
      discountPrice: 320.0,
      price: 320.0,
      stock: 8,
      sku: 'AURA-ROSE-002',
      image: '/images/perfumes/rose-noire.jpg',
      volumeMl: 100,
      notesTop: 'Pimienta Rosa, Mandarina Sanguina, Café Tostado',
      notesHeart: 'Rosa de Taïf Suprema, Jazmín Sambac Nocturno, Nuez Moscada',
      notesBase: 'Pachulí Negro de Indonesia, Vainilla Bourbon, Almizcle Blanco',
      longevity: '12+ Horas',
      sillage: 'Moderado a Intenso',
      isFeatured: true,
      images: [
        { url: '/images/perfumes/rose-noire.jpg', isPrimary: true, order: 1 },
        { url: '/images/perfumes/santal-blanc.jpg', isPrimary: false, order: 2 },
      ],
    },
    {
      id: 'prod_santal_blanc_03',
      name: 'Santal Blanc Impérial',
      brand: 'Aura Niche',
      slug: 'santal-blanc-imperial',
      concentration: 'Extrait de Parfum (36%)',
      olfactiveFamily: 'Boisé Crémeux & Musqué',
      description: 'Sándalo blanco de Mysore destilado artesanalmente, balanceado por iris florentino aterciopelado y leche de almendras tostadas.',
      retailPrice: 340.0,
      discountPrice: 295.0,
      price: 295.0,
      stock: 19,
      sku: 'AURA-SANTAL-003',
      image: '/images/perfumes/santal-blanc.jpg',
      volumeMl: 100,
      notesTop: 'Semillas de Ambreta, Higo Maduro, Enebro Plateado',
      notesHeart: 'Iris Florentino, Violeta Francesa, Madera de Cedro Atlas',
      notesBase: 'Sándalo Blanco de Mysore, Almizcles Sedosos, Haba Tonka',
      longevity: '12+ Horas',
      sillage: 'Aura Íntima & Sofisticada',
      isFeatured: true,
      images: [
        { url: '/images/perfumes/santal-blanc.jpg', isPrimary: true, order: 1 },
        { url: '/images/perfumes/oud-royal.jpg', isPrimary: false, order: 2 },
      ],
    },
    {
      id: 'prod_cuir_imperial_04',
      name: 'Cuir Impérial Privé',
      brand: 'Aura Niche',
      slug: 'cuir-imperial-prive',
      concentration: 'Extrait de Parfum (40%)',
      olfactiveFamily: 'Cuir Royal & Épicé',
      description: 'Inspirado en las monturas de cuero real de Versalles. Cuero curtido ruso bañado en licor de ciruela madura, abedul y sutil toque de tabaco rubio.',
      retailPrice: 460.0,
      discountPrice: 390.0,
      price: 390.0,
      stock: 6,
      sku: 'AURA-CUIR-004',
      image: '/images/perfumes/cuir-imperial.jpg',
      volumeMl: 100,
      notesTop: 'Ciruela Negra Licorosa, Salvia Esclarea, Tomillo Salvaje',
      notesHeart: 'Cuero Ruso Tradicional, Hoja de Tabaco Cubano, Osmanto',
      notesBase: 'Alquitrán de Abedul, Castóreo Sintético, Benjuí de Siam',
      longevity: '16+ Horas',
      sillage: 'Monumental',
      isFeatured: true,
      images: [
        { url: '/images/perfumes/cuir-imperial.jpg', isPrimary: true, order: 1 },
        { url: '/images/perfumes/rose-noire.jpg', isPrimary: false, order: 2 },
      ],
    },
  ];

  for (const p of products) {
    const { images, ...productData } = p;
    await prisma.product.upsert({
      where: { id: p.id },
      update: productData,
      create: productData,
    });

    // Limpiar y crear imágenes asociadas
    await prisma.productImage.deleteMany({
      where: { productId: p.id },
    });

    for (const img of images) {
      await prisma.productImage.create({
        data: {
          productId: p.id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
          localPath: `C:\\ecom-storage\\uploads\\${img.url.split('/').pop()}`,
        },
      });
    }

    console.log(`✓ Producto Real: ${p.name} | Retail: $${p.retailPrice} | Oferta: $${p.discountPrice} | Stock: ${p.stock} frascos.`);
  }

  // 4. Registro inicial en Kardex
  for (const p of products) {
    const existingMovement = await prisma.stockMovement.findFirst({
      where: { productId: p.id },
    });
    if (!existingMovement) {
      await prisma.stockMovement.create({
        data: {
          productId: p.id,
          type: 'MANUAL_RESTOCK',
          changeQuantity: p.stock,
          previousStock: 0,
          newStock: p.stock,
          note: 'Inventario físico inicial auditado y cargado en PostgreSQL',
        },
      });
    }
  }

  console.log('✓ Kardex auditado inicializado.');
  console.log('--- SEEDING COMPLETADO CON ÉXITO ---');
}

main()
  .catch((e) => {
    console.error('Error al poblar BD:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
