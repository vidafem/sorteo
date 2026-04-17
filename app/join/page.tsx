'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

export default function JoinRaffle() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Por favor ingresa un código válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Aquí irá la lógica para verificar el código del sorteo
      // Por ahora, redirigimos a una página de sorteo de ejemplo
      router.push(`/raffle/${code.toUpperCase()}`);
    } catch (err: any) {
      setError('Código de sorteo no encontrado o inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-white/95 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎫</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Unirse a Sorteo</h1>
            <p className="text-gray-600">Ingresa el código del sorteo para participar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código del Sorteo
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-wider"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                El código tiene 6 caracteres alfanuméricos
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 text-lg"
            >
              {loading ? 'Verificando...' : 'Unirse al Sorteo'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Volver al inicio
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}