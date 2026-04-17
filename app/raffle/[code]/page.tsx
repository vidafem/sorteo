'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from '@/lib/supabaseClient';
import {
  eliminateParticipantFromRaffle,
  getRaffleByCode,
  selectWinnerForRaffle,
  joinRaffle,
  type RaffleDetail,
  type RaffleParticipant,
} from '@/lib/queries';

const formatDrawDate = (drawAt: string | null) => {
  if (!drawAt) {
    return 'Aun no se ha programado una fecha de cierre';
  }

  return new Date(drawAt).toLocaleString('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Activo';
    case 'scheduled': return 'Programado';
    case 'closed': return 'Cerrado';
    case 'cancelled': return 'Cancelado';
    default: return 'Borrador';
  }
};

export default function RafflePage() {
  const params = useParams();
  const router = useRouter();
  const { width, height } = useWindowSize();
  const code = String(params.code || '');

  const [raffle, setRaffle] = useState<RaffleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [clockTick, setClockTick] = useState(0);
  
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false);
  const [displayedWinner, setDisplayedWinner] = useState<RaffleParticipant | null>(null);
  const [hideWinnerOverlay, setHideWinnerOverlay] = useState(false);
  const [currentAnimatedNameIndex, setCurrentAnimatedNameIndex] = useState(0);
  const [animationStyle, setAnimationStyle] = useState<'roulette' | 'cards' | 'number'>('cards');
  const [rouletteParticipant, setRouletteParticipant] = useState<RaffleParticipant | null>(null);
  const [previewParticipant, setPreviewParticipant] = useState<RaffleParticipant | null>(null);

  // Estado para el formulario manual
  const [addName, setAddName] = useState('');
  const [addNumbers, setAddNumbers] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addMessage, setAddMessage] = useState('');

  const audioCtxRef = useRef<AudioContext | null>(null);

  const loadRaffle = useCallback(async () => {
    const raffleData = await getRaffleByCode(code);
    setRaffle(raffleData);
  }, [code]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadRaffle();
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadRaffle]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Generador de sonido "Tic" de ruleta usando Web Audio API
  const playTick = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) { /* Silencioso si el navegador bloquea el audio */ }
  }, []);

  // Generador de acorde de victoria
  const playWinSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();

      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 1.5);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 1.5);
      });
    } catch (e) { /* Silencioso si el navegador bloquea el audio */ }
  }, []);

  // Suscripción a cambios en Tiempo Real
  useEffect(() => {
    if (!raffle?.id || !supabase) return;

    const channel = supabase
      .channel('realtime_raffle')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'raffle_participants', filter: `raffle_id=eq.${raffle.id}` },
        () => { void loadRaffle(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'raffles', filter: `id=eq.${raffle.id}` },
        () => { void loadRaffle(); }
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [raffle?.id, loadRaffle]);

  const timeDifference = useMemo(() => {
    if (!raffle?.drawAt) return null;
    return new Date(raffle.drawAt).getTime() - Date.now();
  }, [raffle?.drawAt, clockTick]);

  const isCountdownActive = timeDifference !== null && timeDifference > 0;

  const formatCountdown = useCallback((diff: number) => {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  const countdownText = isCountdownActive ? formatCountdown(timeDifference) : (raffle?.drawAt ? 'Sorteo finalizado' : 'Sin fecha definida');

  const actualWinner = useMemo(
    () => raffle?.participants.find((participant) => participant.status === 'winner') ?? null,
    [raffle],
  );

  // Lógica de la Ruleta y Revelación del Ganador
  useEffect(() => {
    if (actualWinner && !displayedWinner && !showWinnerAnimation) {
      setShowWinnerAnimation(true);
      setHideWinnerOverlay(false);
      
      const timer = setTimeout(() => {
        setShowWinnerAnimation(false);
        setDisplayedWinner(actualWinner);
      }, 7000); // 7 segundos de ruleta (frenado gradual)
      
      return () => clearTimeout(timer);
    } else if (!actualWinner) {
      setDisplayedWinner(null);
      setShowWinnerAnimation(false);
      setHideWinnerOverlay(false);
    }
  }, [actualWinner, displayedWinner, showWinnerAnimation]);

  const occupiedNumbers = useMemo(
    () =>
      (raffle?.participants ?? [])
        .map((participant) => participant.assignedNumber)
        .sort((left, right) => left - right),
    [raffle],
  );
  const activeParticipants = useMemo(
    () => (raffle?.participants ?? []).filter((participant) => participant.status !== 'eliminated'),
    [raffle],
  );

  // Animación de nombres para la Ruleta (comienza rápido y se va deteniendo)
  useEffect(() => {
    if (!showWinnerAnimation || activeParticipants.length === 0 || !actualWinner) return;

    let timeoutId: number;
    const startTime = Date.now();
    const duration = 7000; // Debe coincidir con los 7 segundos de arriba

    const tick = () => {
      const elapsed = Date.now() - startTime;
      
      // Elegir a alguien al azar que NO sea el ganador (para mantener la tensión)
      const others = activeParticipants.filter((p) => p.id !== actualWinner.id);
      const pool = others.length > 0 ? others : activeParticipants;
      const randomIndex = Math.floor(Math.random() * pool.length);
      
      setRouletteParticipant(pool[randomIndex]);
      playTick();

      // Efecto de frenado: inicia en 100ms y va subiendo exponencialmente hasta ~700ms
      const progress = elapsed / duration;
      const nextDelay = 100 + Math.pow(progress, 3) * 600;

      timeoutId = window.setTimeout(tick, nextDelay);
    };

    timeoutId = window.setTimeout(tick, 100);

    return () => window.clearTimeout(timeoutId);
  }, [showWinnerAnimation, activeParticipants, actualWinner, playTick]);

  // Mini-animación de nombres para la Sala de Espera
  useEffect(() => {
    if (activeParticipants.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAnimatedNameIndex((prev) => (prev + 1) % activeParticipants.length);
    }, 1500); // Cambia el nombre cada 1.5 segundos
    return () => clearInterval(interval);
  }, [activeParticipants.length]);

  // Animación continua para la Vista Previa
  useEffect(() => {
    if (activeParticipants.length === 0) return;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * activeParticipants.length);
      setPreviewParticipant(activeParticipants[randomIndex]);
    }, 200); // Velocidad constante
    return () => clearInterval(interval);
  }, [activeParticipants]);

  // Utilidad para la animación de las tarjetas (Slot Machine)
  const getParticipantOffset = useCallback((offset: number, target: RaffleParticipant | null) => {
    if (!activeParticipants || activeParticipants.length === 0) return null;
    const currentIndex = activeParticipants.findIndex(p => p.id === target?.id);
    const safeIndex = currentIndex !== -1 ? currentIndex : 0;
    const idx = (safeIndex + offset + activeParticipants.length * 10) % activeParticipants.length;
    return activeParticipants[idx];
  }, [activeParticipants]);

  const canPickWinner = Boolean(raffle?.staffAccess?.canManageRaffle || raffle?.staffAccess?.canPickWinner);
  const canEliminate = Boolean(raffle?.staffAccess?.canManageRaffle || raffle?.staffAccess?.canEliminateParticipants);

  const handleSelectWinner = useCallback(async (participantId: string) => {
    if (!raffle) {
      return;
    }

    setActionLoadingId(participantId);
    try {
      await selectWinnerForRaffle(raffle.id, participantId);
      await loadRaffle();
    } catch (error) {
      console.error('No se pudo seleccionar el ganador:', error);
    } finally {
      setActionLoadingId('');
    }
  }, [raffle, loadRaffle]);

  const autoTriggered = useRef(false);

  // Auto-disparar el sorteo cuando el tiempo llega a cero (solo el admin)
  useEffect(() => {
    if (timeDifference !== null && timeDifference <= 0 && !autoTriggered.current) {
      autoTriggered.current = true;
      if (canPickWinner && !actualWinner && activeParticipants.length > 0 && !actionLoadingId) {
        const randomIndex = Math.floor(Math.random() * activeParticipants.length);
        void handleSelectWinner(activeParticipants[randomIndex].id);
      }
    }
  }, [timeDifference, canPickWinner, actualWinner, activeParticipants, actionLoadingId, handleSelectWinner]);

  const handleEliminateParticipant = async (participantId: string) => {
    if (!raffle) {
      return;
    }

    setActionLoadingId(participantId);
    try {
      await eliminateParticipantFromRaffle(raffle.id, participantId);
      await loadRaffle();
    } catch (error) {
      console.error('No se pudo eliminar al participante:', error);
    } finally {
      setActionLoadingId('');
    }
  };

  // Función para agregar números manualmente separados por coma
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raffle) return;
    setAddError('');
    setAddMessage('');

    if (!addName.trim() || !addNumbers.trim()) {
      setAddError('Completa el nombre y los numeros.');
      return;
    }

    const numbersToJoin = addNumbers
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    if (numbersToJoin.length === 0) {
      setAddError('Ingresa al menos un numero valido.');
      return;
    }

    const duplicates = numbersToJoin.filter((n) => occupiedNumbers.includes(n));
    if (duplicates.length > 0) {
      const errorMsg = `¡Atención! Los numeros ${duplicates.join(', ')} ya están ocupados por otro participante.`;
      setAddError(errorMsg);
      window.alert(errorMsg); // Lanza la alerta emergente en la pantalla
      return;
    }

    setAdding(true);
    try {
      for (const num of numbersToJoin) {
        await joinRaffle(raffle.id, addName.trim(), num);
      }
      setAddMessage(`Se agregaron ${numbersToJoin.length} boleto(s) a ${addName.trim()}.`);
      setAddName('');
      setAddNumbers('');
      await loadRaffle();
    } catch (err: any) {
      setAddError(err.message || 'Error al agregar los numeros.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff7fb]">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-pink-100 border-t-[#ec2aa4]" />
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="max-w-xl rounded-[2rem] p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-sm font-bold uppercase tracking-[0.2em] text-rose-600">
            Error
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-950">Sorteo no encontrado</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            El codigo <code className="rounded-full bg-[#fff7fb] px-3 py-1 font-bold text-[#ec2aa4]">{code}</code> no corresponde a ningun sorteo visible o publico.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => router.push('/join')} className="px-6 py-3 text-sm">
              Volver a ingresar codigo
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      {/* Overlay de Sorteo en Vivo (Ruleta y Confeti) */}
      {(showWinnerAnimation || (displayedWinner && !hideWinnerOverlay)) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md">
          {displayedWinner && !showWinnerAnimation && (
            <Confetti width={width} height={height} recycle={false} numberOfPieces={600} gravity={0.15} />
          )}
          
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative flex w-full max-w-2xl flex-col items-center justify-center rounded-[3rem] border border-pink-500/30 ${animationStyle === 'cards' && showWinnerAnimation ? 'bg-transparent border-none shadow-none' : 'bg-white p-10 shadow-[0_0_100px_-20px_rgba(236,42,164,0.6)]'} text-center`}
          >
            {showWinnerAnimation ? (
              <>
                {animationStyle === 'roulette' && (
                  <>
                    <p className="text-xl font-bold uppercase tracking-[0.3em] text-[#ec2aa4] animate-pulse">Sorteando...</p>
                    <div className="mt-8 text-5xl font-extrabold text-slate-900 md:text-7xl truncate w-full px-4">
                      {rouletteParticipant?.displayName || '???'}
                    </div>
                  </>
                )}
                {animationStyle === 'cards' && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-6 flex items-center gap-2 rounded-full bg-black/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white shadow-black drop-shadow-md"
                    >
                      <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span></span>
                      Nombres Giratorios
                    </motion.div>
                    <div className="relative flex h-[24rem] w-[22rem] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] bg-white p-2 shadow-[0_20px_60px_-15px_rgba(236,42,164,0.4)]">
                      {/* Gradientes para el efecto de difuminado arriba y abajo */}
                      <div className="pointer-events-none absolute left-0 top-0 z-10 h-24 w-full bg-gradient-to-b from-white via-white/80 to-transparent"></div>
                      <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-24 w-full bg-gradient-to-t from-white via-white/80 to-transparent"></div>

                      <div className="flex w-full flex-col items-center gap-3">
                        {[-2, -1, 0, 1, 2].map((offset) => {
                          const p = getParticipantOffset(offset, rouletteParticipant);
                          const isCenter = offset === 0;
                          return (
                            <div key={offset} className={`flex w-11/12 items-center justify-center px-4 transition-all duration-[80ms] ease-linear ${isCenter ? 'z-20 scale-110 rounded-[1.2rem] bg-[#782381] py-5 text-white shadow-xl' : 'scale-95 py-2 text-slate-400 opacity-40'}`}>
                              {isCenter && (
                                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold shadow-inner">
                                  {p?.displayName?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                              <span className={`truncate font-bold ${isCenter ? 'text-3xl' : 'text-xl'}`}>{p?.displayName || '???'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {animationStyle === 'number' && (
                  <>
                    <p className="text-xl font-bold uppercase tracking-[0.3em] text-[#ec2aa4] animate-pulse">Buscando numero...</p>
                    <div className="mt-6 text-[8rem] leading-none font-black text-slate-900 tracking-tighter">
                      {String(rouletteParticipant?.assignedNumber || 0).padStart(3, '0')}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-xl font-bold uppercase tracking-[0.3em] text-emerald-500">¡Tenemos un ganador!</p>
                <div className="mt-8 text-4xl font-extrabold text-slate-900 md:text-6xl break-words w-full">
                  {displayedWinner?.displayName}
                </div>
                <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-pink-50 text-2xl font-bold text-[#ec2aa4]">
                  #{String(displayedWinner?.assignedNumber).padStart(3, '0')}
                </div>
                <Button onClick={() => setHideWinnerOverlay(true)} className="mt-10 px-10 py-4 text-lg rounded-full">
                  Continuar
                </Button>
              </>
            )}
          </motion.div>
        </div>
      )}

      <header className="border-b border-pink-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="rounded-full border border-pink-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-pink-50"
            >
              Volver
            </button>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ec2aa4]">Sorteo en vivo</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">{raffle.title}</h1>
              <p className="mt-1 text-sm text-slate-500">Codigo compartible: {raffle.raffleCode}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-[1.6rem] bg-white px-5 py-4 shadow-[0_22px_60px_-42px_rgba(190,24,93,0.4)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cuenta regresiva</p>
              <p className="mt-2 text-xl font-bold text-slate-950">{countdownText}</p>
            </div>
            <div className="rounded-[1.6rem] bg-white px-5 py-4 shadow-[0_22px_60px_-42px_rgba(190,24,93,0.4)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Participantes</p>
              <p className="mt-2 text-xl font-bold text-slate-950">{activeParticipants.length}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        {isCountdownActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-br from-[#ec2aa4] to-rose-400 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(236,42,164,0.4)] border border-pink-400 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white opacity-10 mix-blend-overlay" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
            <p className="text-sm md:text-base font-bold uppercase tracking-[0.4em] text-pink-50 mb-6 relative z-10 animate-pulse text-center">El sorteo comienza en</p>
            <div className="text-6xl sm:text-8xl md:text-[10rem] leading-none font-black text-white tracking-tighter tabular-nums text-center drop-shadow-2xl relative z-10">
              {formatCountdown(timeDifference)}
            </div>
          </motion.div>
        )}

        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-[2rem] p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ec2aa4]">Premio principal</p>
                  <h2 className="mt-3 text-3xl font-bold text-slate-950">
                    {raffle.prizeName || 'Premio por definir'}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-500">
                    {raffle.description || 'Este sorteo ya esta listo para recibir participantes mediante su codigo publico.'}
                  </p>
                </div>

                <div className="rounded-[1.8rem] bg-[#fff7fb] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fecha del sorteo</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">{formatDrawDate(raffle.drawAt)}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.2rem] bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Estado</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{getStatusLabel(raffle.status)}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Maximo</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {raffle.maxParticipants ?? 'Sin limite'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-pink-100 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(190,24,93,0.15)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ec2aa4]">Visualizacion</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-bold text-slate-900">¿Como deseas ver el sorteo?</h2>
                <div className="flex flex-wrap gap-1 rounded-full border border-pink-100 bg-pink-50/50 p-1">
                  {[
                    { id: 'roulette', label: 'Ruleta', icon: '🎡' },
                    { id: 'cards', label: 'Tarjetas', icon: '📇' },
                    { id: 'number', label: 'Solo Numero', icon: '🔢' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setAnimationStyle(mode.id as any)}
                      className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold outline-none transition-colors"
                    >
                      {animationStyle === mode.id && (
                        <motion.div
                          layoutId="activeTabMode"
                          className="absolute inset-0 rounded-full bg-[#ec2aa4] shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className={`relative z-10 flex items-center gap-2 ${animationStyle === mode.id ? 'text-white' : 'text-slate-500 hover:text-pink-600'}`}>
                        <motion.span animate={animationStyle === mode.id ? { rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.4 }}>{mode.icon}</motion.span>
                        {mode.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-5 flex h-36 w-full items-center justify-center rounded-2xl bg-slate-950 overflow-hidden relative shadow-inner">
                <div className="absolute top-4 left-5 flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vista Previa</p>
                </div>
                
                {animationStyle === 'roulette' && (
                  <div className="text-3xl font-extrabold text-white truncate px-4">
                    {previewParticipant?.displayName || 'Nombre de Ejemplo'}
                  </div>
                )}
                {animationStyle === 'cards' && (
                  <div className="relative flex h-28 w-56 flex-col items-center justify-center overflow-hidden rounded-[1.2rem] bg-white shadow-lg">
                    <div className="pointer-events-none absolute left-0 top-0 z-10 h-8 w-full bg-gradient-to-b from-white via-white/80 to-transparent"></div>
                    <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-8 w-full bg-gradient-to-t from-white via-white/80 to-transparent"></div>
                    <div className="flex w-full flex-col items-center gap-2">
                      {[-1, 0, 1].map((offset) => {
                        const p = getParticipantOffset(offset, previewParticipant);
                        const isCenter = offset === 0;
                        return (
                          <div key={offset} className={`flex w-11/12 items-center justify-center px-2 transition-all duration-[100ms] ease-linear ${isCenter ? 'z-20 scale-105 rounded-lg bg-[#782381] py-2 text-white shadow-md' : 'scale-90 py-1 text-slate-400 opacity-40'}`}>
                            <span className={`truncate font-bold ${isCenter ? 'text-lg' : 'text-sm'}`}>{p?.displayName || 'Ejemplo'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {animationStyle === 'number' && (
                  <div className="text-6xl font-black text-white tracking-tighter">
                    {String(previewParticipant?.assignedNumber || 99).padStart(3, '0')}
                  </div>
                )}
              </div>
            </div>

            {raffle?.isStaff && (
              <Card className="mb-6 rounded-[2rem] p-6 shadow-sm border border-pink-100">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ec2aa4]">Registro Manual</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Agregar participantes</h2>
                <form onSubmit={handleAddParticipant} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] items-start">
                  <label className="block text-sm font-medium text-slate-700">
                    Nombre del jugador
                    <input
                      type="text"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                      placeholder="Ej: Maria Lopez"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Numeros (separados por coma)
                    <input
                      type="text"
                      value={addNumbers}
                      onChange={(e) => setAddNumbers(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                      placeholder="Ej: 5, 12, 45"
                    />
                  </label>
                  <Button type="submit" disabled={adding} className="mt-7 h-12 px-6 py-2 text-sm">
                    {adding ? 'Agregando...' : 'Agregar'}
                  </Button>
                </form>
                {addError && (
                  <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {addError}
                  </div>
                )}
                {addMessage && (
                  <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {addMessage}
                  </div>
                )}
              </Card>
            )}

            <Card className="rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ec2aa4]">Participantes</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">Lista desplazable del sorteo</h2>
                </div>
                {displayedWinner && (
                  <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                    Ganador: {displayedWinner.displayName}
                  </div>
                )}
              </div>

              <div className="mt-6 max-h-[30rem] space-y-3 overflow-y-auto pr-2">
                {raffle.participants.length === 0 ? (
                  <div className="rounded-[1.6rem] bg-[#fff7fb] px-5 py-6 text-sm text-slate-500">
                    Aun no hay participantes en este sorteo.
                  </div>
                ) : (
                  raffle.participants.map((participant, index) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-[1.5rem] border border-pink-100 bg-white p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-sm font-bold text-[#ec2aa4]">
                            {String(participant.assignedNumber).padStart(2, '0')}
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-slate-950">{participant.displayName}</div>
                            <div className="text-sm text-slate-500">
                              Numero #{String(participant.assignedNumber).padStart(3, '0')}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                              participant.status === 'winner' && !showWinnerAnimation
                                ? 'bg-emerald-100 text-emerald-700'
                                : participant.status === 'eliminated'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {participant.status === 'winner' && showWinnerAnimation ? 'active' : participant.status}
                          </span>

                          {canPickWinner && participant.status !== 'winner' && participant.status !== 'eliminated' && (
                            <button
                              onClick={() => handleSelectWinner(participant.id)}
                              disabled={actionLoadingId === participant.id}
                              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                            >
                              {actionLoadingId === participant.id ? 'Guardando...' : 'Elegir ganador'}
                            </button>
                          )}

                          {canEliminate && participant.status === 'active' && (
                            <button
                              onClick={() => handleEliminateParticipant(participant.id)}
                              disabled={actionLoadingId === participant.id}
                              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                            >
                              {actionLoadingId === participant.id ? 'Guardando...' : 'Eliminar'}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="rounded-[2rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ec2aa4]">Numeros ocupados</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Vista rapida de ocupacion</h2>

              {activeParticipants.length > 0 && (
                <div className="mt-4 flex items-center gap-3 rounded-[1.2rem] bg-pink-50/50 px-4 py-3 border border-pink-100/50">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ec2aa4] opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ec2aa4]"></span>
                  </span>
                  <p className="text-sm font-medium text-slate-600">
                    En sala: <strong className="text-slate-900">{activeParticipants[currentAnimatedNameIndex]?.displayName}</strong>
                  </p>
                </div>
              )}

              <div className="mt-5 flex max-h-60 flex-wrap gap-2 overflow-y-auto">
                {occupiedNumbers.length === 0 ? (
                  <div className="rounded-[1.4rem] bg-[#fff7fb] px-4 py-4 text-sm text-slate-500">
                    Aun no hay numeros reservados.
                  </div>
                ) : (
                  occupiedNumbers.map((number) => (
                    <span
                      key={number}
                      className="rounded-full border border-pink-100 bg-[#fff7fb] px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      #{String(number).padStart(3, '0')}
                    </span>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
