"use client";

import { useState, useEffect, useRef } from "react";
import { getGanador } from "@/src/lib/queries";
import NumberDisplay from "@/src/components/sorteo/NumberDisplay";
import Button from "@/src/components/ui/Button";

export default function Home() {
  const [numero, setNumero] = useState<number | null>(null);
  const [animando, setAnimando] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const iniciarSorteo = async () => {
    setAnimando(true);

    intervalRef.current = window.setInterval(() => {
      setNumero(Math.floor(Math.random() * 999));
    }, 80);

    timeoutRef.current = window.setTimeout(async () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);

      const ganador = await getGanador();

      if (ganador) {
        setNumero(ganador.ticket_bloqueado);
      }

      setAnimando(false);
    }, 4000);
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-black text-white">
      
      <h1 className="text-4xl mb-10">🎰 SORTEO</h1>

      <NumberDisplay numero={numero} />

      <div className="mt-10">
        <Button onClick={iniciarSorteo} disabled={animando}>
          Iniciar Sorteo
        </Button>
      </div>

    </main>
  );
}