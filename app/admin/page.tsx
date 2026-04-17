"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import FormConcursante from "@/components/admin/FormConcursante";
import ListaConcursantes from "@/components/admin/ListaConcursantes";
import { getConcursantes, marcarGanador, getCurrentUser, type Concursante } from "@/lib/queries";
import { Button } from "@/components/ui/Button";

const ADMIN_EMAILS = ['admin1@example.com', 'admin2@example.com']; // Cambiar por los emails reales

export default function Admin() {
  const [concursantes, setConcursantes] = useState<Concursante[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchConcursantes = useCallback(async () => {
    const data = await getConcursantes();
    setConcursantes(data);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setIsAdmin(ADMIN_EMAILS.includes(user.email || ''));
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!loading && isAdmin) {
      const fetchData = async () => {
        const data = await getConcursantes();
        setConcursantes(data);
      };
      fetchData();
    }
  }, [loading, isAdmin]);

  const handleMarcarGanador = async (id: string | number) => {
    try {
      await marcarGanador(id);
      await fetchConcursantes();
    } catch (error) {
      console.error('Error al marcar ganador:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Acceso Denegado</h1>
          <p className="text-xl">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent mb-4">
            🎯 PANEL DE ADMINISTRACIÓN
          </h1>
          <p className="text-xl text-gray-300">
            Gestiona los participantes del sorteo
          </p>
        </header>

        {/* Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-red-500/20">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-6 text-center">
              ➕ Agregar Participante
            </h2>
            <FormConcursante onConcursanteAdded={fetchConcursantes} />
          </div>

          <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-red-500/20">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-6 text-center">
              📋 Lista de Participantes
            </h2>
            <ListaConcursantes concursantes={concursantes} />
          </div>
        </div>

        {/* Selección de Ganador */}
        <div className="mt-12">
          <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-red-500/20">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-6 text-center">
              🏆 Seleccionar Ganador
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {concursantes.map((concursante) => (
                <div key={concursante.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{concursante.nombre}</p>
                    <p className="text-gray-400 text-sm">Ticket: {concursante.ticket_bloqueado}</p>
                  </div>
                  <Button
                    onClick={() => handleMarcarGanador(concursante.id)}
                    disabled={concursante.es_ganador}
                    className={`px-4 py-2 rounded ${
                      concursante.es_ganador
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-500 text-black hover:bg-yellow-400'
                    }`}
                  >
                    {concursante.es_ganador ? 'Ganador' : 'Seleccionar'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
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