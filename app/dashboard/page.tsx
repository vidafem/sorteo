'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/queries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

interface Raffle {
  id: string;
  title: string;
  code: string;
  status: 'active' | 'completed' | 'pending';
  participants: number;
  endDate: string;
  prize: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/');
          return;
        }
        setUser(currentUser);

        // Aquí cargaríamos los sorteos del usuario desde Supabase
        // Por ahora, datos de ejemplo
        setRaffles([
          {
            id: '1',
            title: 'Sorteo iPhone 15',
            code: 'ABC123',
            status: 'active',
            participants: 45,
            endDate: '2024-12-25',
            prize: 'iPhone 15 Pro Max'
          },
          {
            id: '2',
            title: 'Viaje a Cancún',
            code: 'XYZ789',
            status: 'pending',
            participants: 12,
            endDate: '2024-12-30',
            prize: 'Viaje todo pagado'
          }
        ]);
      } catch (error) {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // Aquí podríamos mostrar un toast de éxito
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-white">{user?.email}</span>
              <Button
                onClick={() => router.push('/')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Create New Raffle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Crear Nuevo Sorteo</h2>
                <p className="text-gray-300">Organiza un sorteo y gana premios increíbles</p>
              </div>
              <Button className="mt-4 md:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                + Crear Sorteo
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* My Raffles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Mis Sorteos</h2>

          {raffles.length === 0 ? (
            <Card className="p-8 text-center bg-white/10 backdrop-blur-sm">
              <div className="text-6xl mb-4">🎲</div>
              <h3 className="text-xl font-semibold text-white mb-2">No tienes sorteos aún</h3>
              <p className="text-gray-300 mb-6">Crea tu primer sorteo para comenzar</p>
              <Button className="bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600">
                Crear Primer Sorteo
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {raffles.map((raffle, index) => (
                <motion.div
                  key={raffle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/30 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white">{raffle.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(raffle.status)}`}>
                        {getStatusText(raffle.status)}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Código:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-black/30 px-2 py-1 rounded text-yellow-400 font-mono">
                            {raffle.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(raffle.code)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Copiar código"
                          >
                            📋
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Participantes:</span>
                        <span className="text-white font-semibold">{raffle.participants}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Fecha fin:</span>
                        <span className="text-white">{new Date(raffle.endDate).toLocaleDateString()}</span>
                      </div>

                      <div className="pt-2 border-t border-white/20">
                        <p className="text-sm text-gray-300">Premio:</p>
                        <p className="text-white font-medium">{raffle.prize}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/raffle/${raffle.code}`)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Ver Sorteo
                      </Button>
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Gestionar
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}