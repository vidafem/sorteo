"use client";

import type { Concursante } from "@/lib/queries";

export default function ListaConcursantes({
  concursantes,
}: {
  concursantes: Concursante[];
}) {
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {concursantes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📝</div>
          <p>No hay participantes registrados aún</p>
        </div>
      ) : (
        concursantes.map((c, index) => (
          <div
            key={c.id}
            className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-4 rounded-xl border border-red-500/20 hover:border-yellow-500/40 transition-all duration-200"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-white">{c.nombre}</p>
                  <p className="text-sm text-gray-400">Participante #{c.id}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gradient-to-r from-yellow-600 to-red-600 px-3 py-1 rounded-full text-white font-bold text-lg">
                  #{c.ticket_bloqueado.toString().padStart(3, '0')}
                </div>
                {c.es_ganador && (
                  <div className="mt-1 text-xs text-yellow-400 font-semibold">
                    🏆 GANADOR
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}