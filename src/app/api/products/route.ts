import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/store';

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al recuperar catálogo' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const sku = body.sku || `AUR-${body.brand.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const retailPrice = Number(body.retailPrice || body.price || 0);
    const discountPrice = body.discountPrice ? Number(body.discountPrice) : undefined;
    const effectivePrice = discountPrice && discountPrice > 0 ? discountPrice : retailPrice;

    const newProduct = await createProduct({
      name: body.name,
      brand: body.brand,
      slug,
      concentration: body.concentration || 'Extrait de Parfum (35%)',
      olfactiveFamily: body.olfactiveFamily || 'Oriental & Oud',
      description: body.description || '',
      retailPrice,
      discountPrice,
      price: effectivePrice,
      originalPrice: retailPrice,
      stock: Number(body.stock || 0),
      sku,
      image: body.image || (body.images && body.images[0]?.url) || '/images/perfumes/oud-royal.jpg',
      images: body.images || [],
      volumeMl: Number(body.volumeMl || 100),
      notesTop: body.notesTop || 'Notas Cítricas',
      notesHeart: body.notesHeart || 'Maderas Nobles',
      notesBase: body.notesBase || 'Ámbar y Resinas',
      longevity: body.longevity || '14+ Horas',
      sillage: body.sillage || 'Intenso',
      isFeatured: Boolean(body.isFeatured),
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al crear perfume' }, { status: 500 });
  }
}
