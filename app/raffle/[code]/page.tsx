'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

interface Participant {
  id: string;
  name: string;
  ticketNumber: number;
}

interface Raffle {
  id: string;
  title: string;
  code: string;
  prize: string;
  endDate: string;
  participants: Participant[];
  status: 'active' | 'completed' | 'pending';
  timeLeft: string;
}

export default function RafflePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const loadRaffle = async () => {
      try {
        // Aquí cargaríamos el sorteo desde Supabase
        // Por ahora, datos de ejemplo
        const mockRaffle: Raffle = {
          id: '1',
          title: 'Sorteo iPhone 15 Pro Max',
          code: code.toUpperCase(),
          prize: 'iPhone 15 Pro Max 256GB',
          endDate: '2024-12-25T23:59:59',
          status: 'active',
          timeLeft: '2d 14h 32m',
          participants: [
            { id: '1', name: 'María García', ticketNumber: 1 },
            { id: '2', name: 'Carlos Rodríguez', ticketNumber: 2 },
            { id: '3', name: 'Ana López', ticketNumber: 3 },
            { id: '4', name: 'Pedro Martínez', ticketNumber: 4 },
            { id: '5', name: 'Laura Sánchez', ticketNumber: 5 },
            { id: '6', name: 'Miguel Fernández', ticketNumber: 6 },
            { id: '7', name: 'Carmen González', ticketNumber: 7 },
            { id: '8', name: 'David Pérez', ticketNumber: 8 },
          ]
        };

        setRaffle(mockRaffle);
      } catch (error) {
        console.error('Error loading raffle:', error);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      loadRaffle();
    }
  }, [code]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    // Aquí agregaríamos al participante al sorteo
    setJoined(true);
    setShowJoinForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900">
        <Card className="p-8 text-center bg-white/95 backdrop-blur-sm max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sorteo No Encontrado</h1>
          <p className="text-gray-600 mb-6">
            El código <code className="bg-gray-100 px-2 py-1 rounded">{code}</code> no corresponde a ningún sorteo activo.
          </p>
          <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700">
            Volver al Inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                ← Volver
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">{raffle.title}</h1>
                <p className="text-gray-300 text-sm">Código: {raffle.code}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-semibold">⏰ {raffle.timeLeft}</div>
              <div className="text-gray-300 text-sm">Tiempo restante</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Raffle Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prize Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-8 bg-gradient-to-br from-yellow-400/20 to-red-500/20 border-yellow-400/30">
                <div className="text-center">
                  <div className="text-8xl mb-4">🎁</div>
                  <h2 className="text-3xl font-bold text-white mb-2">Premio</h2>
                  <p className="text-2xl text-yellow-400 font-semibold">{raffle.prize}</p>
                  <div className="mt-4 text-gray-300">
                    Finaliza: {new Date(raffle.endDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Participants List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Participantes ({raffle.participants.length})
                </h3>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {raffle.participants.map((participant, index) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {participant.ticketNumber}
                        </div>
                        <span className="text-white">{participant.name}</span>
                      </div>
                      <span className="text-gray-400 text-sm">#{participant.ticketNumber.toString().padStart(3, '0')}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Form */}
            {!joined && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6 bg-white/95 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">¡Únete al Sorteo!</h3>

                  {!showJoinForm ? (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        Participa por el premio y ten la oportunidad de ganar.
                      </p>
                      <Button
                        onClick={() => setShowJoinForm(true)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        Unirme Ahora
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleJoin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tu Nombre
                        </label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Ingresa tu nombre completo"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowJoinForm(false)}
                          className="flex-1 bg-gray-500 hover:bg-gray-600"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          Unirme
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              </motion.div>
            )}

            {joined && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <Card className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-green-500/30">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-white mb-2">¡Te uniste al sorteo!</h3>
                  <p className="text-gray-300">
                    Tu número de participación aparecerá en la lista pronto.
                  </p>
                </Card>
              </motion.div>
            )}

            {/* Raffle Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-6 bg-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Participantes:</span>
                    <span className="text-white font-semibold">{raffle.participants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Estado:</span>
                    <span className="text-green-400 font-semibold">Activo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Código:</span>
                    <code className="text-yellow-400 font-mono">{raffle.code}</code>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}