'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { getRaffleByCode } from '@/lib/queries';

export default function JoinRaffle() {
  const [code, setCode] = useState('');
  const [viewerName, setViewerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!code.trim()) {
      setError('Por favor ingresa un codigo valido.');
      return;
    }
    if (!viewerName.trim()) {
      setError('Por favor ingresa tu nombre de espectador.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const raffle = await getRaffleByCode(code);

      if (!raffle) {
        setError('Codigo de sorteo no encontrado o no disponible.');
        return;
      }

      router.push(`/raffle/${raffle.raffleCode}?viewer=${encodeURIComponent(viewerName.trim())}`);
    } catch (joinError: any) {
      setError(joinError?.message || 'No se pudo validar el codigo del sorteo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <Card className="rounded-[2rem] p-8 sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-50 text-lg font-bold uppercase tracking-[0.2em] text-[#ec2aa4]">
              Join
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.32em] text-[#ec2aa4]">Ingresar al sorteo</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Escribe tu codigo y entra en segundos</h1>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              Tu Nombre (Como espectador)
              <input
                type="text"
                value={viewerName}
                onChange={(event) => setViewerName(event.target.value)}
                placeholder="Ej: Juan Perez"
                className="mt-2 w-full rounded-[1.6rem] border border-pink-100 bg-[#fff9fc] px-5 py-4 text-center text-xl font-bold text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Codigo del sorteo
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Ej: 8A3F2B1C"
                className="mt-2 w-full rounded-[1.6rem] border border-pink-100 bg-[#fff9fc] px-5 py-4 text-center text-2xl font-bold tracking-[0.32em] text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                maxLength={8}
                required
              />
            </label>

            <p className="rounded-[1.4rem] bg-[#fff7fb] px-4 py-3 text-xs leading-6 text-slate-500 sm:text-sm">
              El codigo se genera automaticamente cuando el creador registra el sorteo desde su dashboard.
            </p>

            {error && (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full px-6 py-4 text-base">
              {loading ? 'Validando codigo...' : 'Entrar al sorteo'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm font-semibold text-slate-500 transition hover:text-[#ec2aa4]"
            >
              Volver al inicio
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
