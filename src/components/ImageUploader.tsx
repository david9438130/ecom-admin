'use client';

import React, { useState } from 'react';
import { UploadCloud, Star, Trash2, Loader2, Plus } from 'lucide-react';

interface ImageUploaderProps {
  images: { url: string; localPath?: string; isPrimary: boolean; order: number }[];
  onChange: (images: { url: string; localPath?: string; isPrimary: boolean; order: number }[]) => void;
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [directUrl, setDirectUrl] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.files) {
        const newImages = [...images];
        data.files.forEach((f: any, idx: number) => {
          newImages.push({
            url: f.url,
            localPath: f.localPath,
            isPrimary: newImages.length === 0 && idx === 0,
            order: newImages.length + 1,
          });
        });
        onChange(newImages);
      }
    } catch (err) {
      console.error('Error al subir imágenes:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddDirectUrl = () => {
    if (!directUrl.trim()) return;
    const newImages = [
      ...images,
      {
        url: directUrl.trim(),
        isPrimary: images.length === 0,
        order: images.length + 1,
      },
    ];
    onChange(newImages);
    setDirectUrl('');
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const filtered = images.filter((_, i) => i !== index);
    if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    onChange(filtered);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] uppercase tracking-wider text-[#12241c] font-bold">
          Galería de Imágenes del Perfume (Múltiples / Disco C: / BLOB)
        </label>
        <span className="text-[10px] text-neutral-500 font-medium">
          {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
        </span>
      </div>

      {/* Upload Dropzone / Button */}
      <div className="p-4 border-2 border-dashed border-[#0f4c3a]/25 hover:border-[#0f4c3a]/60 rounded-2xl bg-[#fbfbf9] text-center transition-all">
        <input
          type="file"
          id="product-images-input"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="product-images-input"
          className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-2"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-[#0f4c3a] animate-spin" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-[#0f4c3a]/20 flex items-center justify-center text-[#0f4c3a]">
              <UploadCloud className="w-5 h-5" />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-[#0a261a]">
              {uploading ? 'Guardando en C:\\ecom-storage\\uploads...' : 'Haz clic para subir fotos desde tu computadora'}
            </p>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Soporta múltiples JPG, PNG, WEBP. Se almacenan físicamente en la unidad C: y en public/uploads.
            </p>
          </div>
        </label>
      </div>

      {/* Add via URL / Local Path */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="O ingresa ruta/URL (ej: /images/perfumes/oud-royal.jpg)"
          value={directUrl}
          onChange={(e) => setDirectUrl(e.target.value)}
          className="flex-1 px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] placeholder-neutral-400 focus:outline-none focus:border-[#0f4c3a]"
        />
        <button
          type="button"
          onClick={handleAddDirectUrl}
          className="px-3 py-2 bg-[#0f4c3a] hover:bg-[#155e42] text-white text-xs font-medium rounded-xl flex items-center gap-1 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir</span>
        </button>
      </div>

      {/* Thumbnails Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative group rounded-xl overflow-hidden border-2 bg-white aspect-square flex flex-col justify-between p-1.5 transition-all shadow-xs ${
                img.isPrimary
                  ? 'border-[#0f4c3a] ring-2 ring-[#0f4c3a]/20 shadow-md'
                  : 'border-neutral-200 hover:border-[#0f4c3a]/40'
              }`}
            >
              {/* Image Preview */}
              <img
                src={img.url}
                alt={`Imagen ${idx + 1}`}
                className="w-full h-full object-cover rounded-lg absolute inset-0 -z-0"
              />

              {/* Badges / Controls */}
              <div className="relative z-10 flex items-center justify-between w-full">
                {img.isPrimary ? (
                  <span className="text-[9px] font-bold bg-[#0f4c3a] text-white px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    Portada
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="text-[9px] bg-white/90 hover:bg-[#0f4c3a] text-[#0f4c3a] hover:text-white font-bold px-1.5 py-0.5 rounded transition-all shadow-xs"
                  >
                    Portada
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1 rounded bg-white/90 hover:bg-rose-600 text-neutral-600 hover:text-white transition-all shadow-xs"
                  title="Eliminar imagen"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="relative z-10 w-full mt-auto">
                <span className="text-[8px] bg-white/90 px-1 py-0.5 rounded text-neutral-700 font-mono block truncate shadow-xs">
                  {img.url.split('/').pop()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
