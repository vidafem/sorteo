"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { getGanador } from "@/src/lib/queries";
import NumberDisplay from "@/src/components/sorteo/NumberDisplay";
import Button from "@/src/components/ui/Button";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export default function Home() {
  const [numero, setNumero] = useState<number | null>(null);
  const [animando, setAnimando] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const { width, height } = useWindowSize();

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const iniciarSorteo = async () => {
    setAnimando(true);
    setShowConfetti(false);

    intervalRef.current = window.setInterval(() => {
      setNumero(Math.floor(Math.random() * 999));
    }, 80);

    timeoutRef.current = window.setTimeout(async () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);

      const ganador = await getGanador();

      if (ganador) {
        setNumero(ganador.ticket_bloqueado);
        setShowConfetti(true);
      }

      setAnimando(false);
    }, 4000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 text-white relative overflow-hidden">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          colors={['#FFD700', '#FF0000', '#FFA500', '#FFFF00', '#FF69B4']}
        />
      )}

      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-red-500/5"></div>
      </div>

      <header className="relative z-10 p-6 text-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">
          🎰 SORTEO PREMIUM
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          ¡Participa en nuestro sorteo exclusivo! Números aleatorios con animación profesional.
        </p>
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-12">
        <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-red-500/20 max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4">SORTEO EN VIVO</h2>
            <div className="bg-gradient-to-r from-red-600 to-yellow-600 p-1 rounded-2xl">
              <NumberDisplay numero={numero} />
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={iniciarSorteo}
              disabled={animando}
              className="w-full py-4 text-lg font-bold bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              {animando ? 'SORTEANDO...' : '🎯 INICIAR SORTEO'}
            </Button>
            {animando && (
              <p className="mt-4 text-sm text-gray-400 animate-pulse">
                Generando números aleatorios...
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 text-center max-w-md">
          <p className="text-sm text-gray-400">
            Participantes registrados: <span className="text-yellow-400 font-semibold">Ver en panel admin</span>
          </p>
        </div>
      </div>

      <footer className="relative z-10 p-6 text-center border-t border-red-500/20">
        <p className="text-sm text-gray-400">
          © 2026 Sorteo Premium - Todos los derechos reservados
        </p>
      </footer>
    </main>
  );
}