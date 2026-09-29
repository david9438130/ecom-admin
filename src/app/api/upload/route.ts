import { NextRequest, NextResponse } from 'next/server';
import { put, get, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

// GET: Recuperar blobs privados (ej: vouchers de pago o documentos sensibles)
export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.searchParams.get('pathname');
    if (!pathname) {
      return NextResponse.json({ error: 'Parámetro pathname requerido' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN no configurado' }, { status: 500 });
    }

    const result = await get(pathname, {
      access: 'private',
      token,
    });

    if (!result) {
      return new NextResponse('Archivo no encontrado', { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        'Cache-Control': 'private, no-cache',
        'Content-Type': result.blob.contentType || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('Error al obtener blob:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener blob' }, { status: 500 });
  }
}

// POST: Subir archivos directamente a Vercel Blob (o respaldo local si no hay token)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    const requestedAccess = (formData.get('access') as 'public' | 'private') || 'private';
    const folder = (formData.get('folder') as string) || 'perfumes';

    if (singleFile && (!files || files.length === 0)) {
      files.push(singleFile);
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const uploadedResults = [];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function') continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const blobPath = `${folder}/${Date.now()}_${sanitizedName}`;

      // Si tenemos Vercel Blob Token configurado: Subir a la nube de Vercel Blob
      if (token) {
        try {
          const blob = await put(blobPath, buffer, {
            access: requestedAccess,
            contentType: file.type || 'image/jpeg',
            addRandomSuffix: true,
            token,
          });

          // Si el store es privado, la URL accesible desde el cliente es a través de nuestra API proxy
          const accessibleUrl = requestedAccess === 'private'
            ? `/api/upload?pathname=${encodeURIComponent(blob.pathname)}`
            : blob.url;

          uploadedResults.push({
            name: file.name,
            url: accessibleUrl,
            directUrl: blob.url,
            pathname: blob.pathname,
            downloadUrl: blob.downloadUrl,
            storage: 'vercel-blob',
            access: requestedAccess,
            size: file.size,
            type: file.type,
          });
          continue;
        } catch (blobErr: any) {
          console.warn('Fallo subida a Vercel Blob, recurriendo a local:', blobErr.message);
        }
      }

      // Fallback local para entorno offline sin token
      const projectUploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(projectUploadsDir)) {
        fs.mkdirSync(projectUploadsDir, { recursive: true });
      }

      const uniqueFileName = `${Date.now()}_${sanitizedName}`;
      const targetProjectPath = path.join(projectUploadsDir, uniqueFileName);
      fs.writeFileSync(targetProjectPath, buffer);

      uploadedResults.push({
        name: file.name,
        fileName: uniqueFileName,
        url: `/uploads/${uniqueFileName}`,
        storage: 'local-disk',
        size: file.size,
        type: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults,
      count: uploadedResults.length,
      storage: token ? 'vercel-blob' : 'local-disk',
    });
  } catch (error: any) {
    console.error('Error al procesar subida:', error);
    return NextResponse.json(
      { error: 'Error al procesar la subida de imagen', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar blob de Vercel Storage
export async function DELETE(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token && url.includes('blob.vercel-storage.com')) {
      await del(url, { token });
      return NextResponse.json({ success: true, message: 'Blob eliminado de Vercel Storage' });
    }

    return NextResponse.json({ success: true, message: 'Archivo omitido o local' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
