'use client';

import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertTriangle } from 'lucide-react';
import { User } from '@/lib/types';

interface AdminLoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      if (data.success && data.user) {
        localStorage.setItem('aura_admin_session', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-[#12241c] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-100/60 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-50 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-white border border-[#0f4c3a]/20 rounded-3xl p-8 shadow-xl backdrop-blur-xl">
        {/* Emblem & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-[#0f4c3a]/25 flex items-center justify-center mx-auto mb-4 text-[#0f4c3a] shadow-xs">
            <Shield className="w-8 h-8" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.35em] text-[#0f4c3a] font-bold">
            Suite Operativa Privada
          </span>
          <h1 className="font-serif-luxury text-3xl text-[#0a261a] mt-1 font-normal">
            Aura Maison • Admin
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Acceso restringido para personal y perfiles autorizados
          </p>
        </div>

        {/* Clean, Secure Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#12241c] mb-1.5 font-bold">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="superadmin@auraparfums.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#fbfbf9] border border-[#0f4c3a]/20 focus:border-[#0f4c3a] rounded-xl text-xs text-[#12241c] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#0f4c3a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#12241c] mb-1.5 font-bold">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#fbfbf9] border border-[#0f4c3a]/20 focus:border-[#0f4c3a] rounded-xl text-xs text-[#12241c] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#0f4c3a]"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0f4c3a] hover:bg-[#14634c] text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0f4c3a]/20 disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-[#0f4c3a]/10 text-center">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#0f4c3a] font-bold hover:underline"
          >
            ← Volver a la Tienda de Clientes (Puerto 3000)
          </a>
        </div>
      </div>
    </div>
  );
}
