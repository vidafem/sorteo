"use client";

import { useState } from "react";
import { crearConcursante } from "@/src/lib/queries";

interface FormConcursanteProps {
  onConcursanteAdded: () => void;
}

export default function FormConcursante({ onConcursanteAdded }: FormConcursanteProps) {
  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const guardar = async () => {
    if (!nombre.trim() || !numero) {
      setMessage("⚠️ Por favor, completa todos los campos.");
      return;
    }

    const num = Number(numero);
    if (num < 0 || num > 999) {
      setMessage("⚠️ El número debe estar entre 0 y 999.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await crearConcursante({
        nombre: nombre.trim(),
        ticket_bloqueado: num,
        es_ganador: false,
      });

      setMessage("✅ Concursante guardado con éxito!");
      setNombre("");
      setNumero("");
      onConcursanteAdded();
    } catch (error) {
      setMessage("❌ Error al guardar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            👤 Nombre del Participante
          </label>
          <input
            value={nombre}
            placeholder="Ingresa el nombre completo"
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-red-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🎫 Número de Ticket
          </label>
          <input
            value={numero}
            placeholder="0-999"
            type="number"
            min="0"
            max="999"
            onChange={(e) => setNumero(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-red-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            disabled={loading}
          />
        </div>
      </div>

      <button
        onClick={guardar}
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200 border border-green-400/50"
      >
        {loading ? "⏳ Guardando..." : "💾 Guardar Participante"}
      </button>

      {message && (
        <div className={`p-4 rounded-xl text-center font-medium ${
          message.includes("✅") ? "bg-green-500/20 text-green-400 border border-green-500/30" :
          message.includes("⚠️") ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
          "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
    </div>
  );
}