"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import FormConcursante from "@/src/components/admin/FormConcursante";
import ListaConcursantes from "@/src/components/admin/ListaConcursantes";
import { getConcursantes, type Concursante } from "@/src/lib/queries";

export default function Admin() {
  const [concursantes, setConcursantes] = useState<Concursante[]>([]);

  const fetchConcursantes = useCallback(async () => {
    const data = await getConcursantes();
    setConcursantes(data);
  }, []);

  useEffect(() => {
  const fetchData = async () => {
    const data = await getConcursantes();
    setConcursantes(data);
  };
  fetchData();
}, []);
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