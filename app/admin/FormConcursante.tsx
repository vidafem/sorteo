"use client";

import { useState } from "react";
import { crearConcursante } from "@/lib/queries";

interface FormConcursanteProps {
  onConcursanteAdded: () => void;
}

export default function FormConcursante({ onConcursanteAdded }: FormConcursanteProps) {
  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("");

  const guardar = async () => {
    if (!nombre || !numero) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    await crearConcursante({
      nombre,
      ticket_bloqueado: Number(numero),
      es_ganador: false,
    });

    alert("Concursante guardado con éxito");
    setNombre("");
    setNumero("");
    onConcursanteAdded();
  };

  return (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
      <h2 className="text-xl mb-4 font-semibold">Agregar Concursante</h2>
      <input
        value={nombre}
        placeholder="Nombre"
        onChange={(e) => setNombre(e.target.value)}
        className="border border-gray-600 bg-transparent p-2 rounded block mb-3 w-full"
      />
      <input
        value={numero}
        placeholder="Número"
        type="number"
        onChange={(e) => setNumero(e.target.value)}
        className="border border-gray-600 bg-transparent p-2 rounded block mb-4 w-full"
      />
      <button onClick={guardar} className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-4 py-2 rounded w-full">
        Guardar
      </button>
    </div>
  );
}