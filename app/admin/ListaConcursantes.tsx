"use client";

export interface Concursante {
  id: string | number;
  nombre: string;
  ticket_bloqueado: number;
}

export default function ListaConcursantes({
  concursantes,
}: {
  concursantes: Concursante[];
}) {
  return (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
      <h2 className="text-xl mb-4 font-semibold">Lista de Concursantes</h2>
      {concursantes.map((c) => (
        <div key={c.id} className="border-b border-gray-700/50 py-3 flex justify-between items-center last:border-0">
          <span className="font-medium">{c.nombre}</span>
          <span className="bg-white/10 px-2 py-1 rounded text-sm text-gray-300">#{c.ticket_bloqueado}</span>
        </div>
      ))}
    </div>
  );
}