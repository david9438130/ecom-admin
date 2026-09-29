import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      // Also check for single 'file'
      const singleFile = formData.get('file') as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }

    // Directorios destino:
    // 1. public/uploads dentro del proyecto
    const projectUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    // 2. Carpeta física fija en C:\ para respaldo y almacenamiento local blob
    const localStorageDir = 'C:\\ecom-storage\\uploads';

    if (!fs.existsSync(projectUploadsDir)) {
      fs.mkdirSync(projectUploadsDir, { recursive: true });
    }
    if (!fs.existsSync(localStorageDir)) {
      fs.mkdirSync(localStorageDir, { recursive: true });
    }

    const uploadedResults = [];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function') continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generar nombre seguro y único
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedName}`;

      const targetProjectPath = path.join(projectUploadsDir, uniqueFileName);
      const targetCPath = path.join(localStorageDir, uniqueFileName);

      // Guardar en ambas ubicaciones (Next.js public y C:\ecom-storage\uploads)
      fs.writeFileSync(targetProjectPath, buffer);
      fs.writeFileSync(targetCPath, buffer);

      // Convertir a base64 / blobData para persistencia opcional
      const mimeType = file.type || 'image/jpeg';
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

      uploadedResults.push({
        name: file.name,
        fileName: uniqueFileName,
        url: `/uploads/${uniqueFileName}`,
        localPath: targetCPath,
        blobData: base64Data.length < 500000 ? base64Data : null, // Guardar base64 si es razonable
        size: file.size,
        type: mimeType,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults,
      count: uploadedResults.length,
      storageDirectory: localStorageDir,
    });
  } catch (error: any) {
    console.error('Error al subir imagen local:', error);
    return NextResponse.json(
      { error: 'Error al procesar la subida de imagen', details: error.message },
      { status: 500 }
    );
  }
}
