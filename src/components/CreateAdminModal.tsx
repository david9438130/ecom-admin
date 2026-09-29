'use client';

import React, { useState, useEffect } from 'react';
import { Shield, X, UserPlus, Lock, Mail, User, Phone, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { Profile } from '@/lib/types';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminCreated: () => void;
  requesterEmail: string;
}

export default function CreateAdminModal({
  isOpen,
  onClose,
  onAdminCreated,
  requesterEmail,
}: CreateAdminModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SUPERADMIN'>('ADMIN');
  const [phone, setPhone] = useState('');
  const [profileId, setProfileId] = useState<string>('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/profiles')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profiles) {
            setProfiles(data.profiles);
            if (data.profiles.length > 0) {
              setProfileId(data.profiles[0].id);
            }
          }
        })
        .catch((e) => console.error('Error fetching profiles', e));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/users/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          phone,
          profileId: profileId || undefined,
          requesterEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear administrador');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onAdminCreated();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082d22]/40 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white border border-[#0f4c3a]/25 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12241c]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-[#0f4c3a] rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-[#0f4c3a]/20 flex items-center justify-center text-[#0f4c3a]">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#0f4c3a] font-bold">
              Privilegio Exclusivo de Superadmin
            </span>
            <h2 className="font-serif-luxury text-xl text-[#0a261a]">Crear Nuevo Administrador</h2>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#0f4c3a] mx-auto animate-bounce" />
            <p className="font-bold text-[#0a261a]">¡Administrador creado con éxito!</p>
            <p className="text-xs text-neutral-500">
              Registrado en PostgreSQL con credenciales protegidas y perfil asignado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#12241c] mb-1 font-bold">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Marc de Villiers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] focus:outline-none focus:border-[#0f4c3a]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#12241c] mb-1 font-bold">
                Correo Electrónico Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@auraparfums.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] focus:outline-none focus:border-[#0f4c3a]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#12241c] mb-1 font-bold">
                Contraseña Inicial
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] focus:outline-none focus:border-[#0f4c3a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#12241c] mb-1 font-bold">
                  Rol del Sistema
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] focus:outline-none focus:border-[#0f4c3a]"
                >
                  <option value="ADMIN">ADMIN (Operaciones)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Control Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#12241c] mb-1 font-bold">
                  Perfil de Permisos
                </label>
                <select
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] focus:outline-none focus:border-[#0f4c3a]"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#12241c] mb-1 font-bold">
                Teléfono de Contacto (Opcional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="+51 900 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] focus:outline-none focus:border-[#0f4c3a]"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#0f4c3a] hover:bg-[#155e42] text-white font-semibold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Guardando en PostgreSQL...' : 'Registrar Administrador'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
