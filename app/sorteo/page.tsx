'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getConcursantes, getGanador, type Concursante } from '@/lib/queries';
import DrumAnimation from '@/components/sorteo/DrumAnimation';
import NumberDisplay from '@/components/sorteo/NumberDisplay';
import WinnerReveal from '@/components/sorteo/WinnerReveal';

export default function SorteoPage() {
  const [user, setUser] = useState<any>(null);
  const [concursantes, setConcursantes] = useState<Concursante[]>([]);
  const [ganador, setGanador] = useState<Concursante | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const concursantesData = await getConcursantes();
        setConcursantes(concursantesData);

        const ganadorData = await getGanador();
        setGanador(ganadorData);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent mb-4">
            🎯 SORTEO EN VIVO
          </h1>
          <p className="text-xl text-gray-300">
            ¡El momento de la verdad ha llegado!
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-red-500/20">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-6 text-center">
              🥁 Animación del Sorteo
            </h2>
            <DrumAnimation />
          </div>

          <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-red-500/20">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-6 text-center">
              📊 Información del Sorteo
            </h2>
            <NumberDisplay numero={ganador?.ticket_bloqueado || null} />
            {ganador && <WinnerReveal nombre={ganador.nombre} />}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 inline-block">
            <p className="text-lg text-gray-300">
              Total de participantes: <span className="text-yellow-400 font-bold text-2xl">{concursantes.length}</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}