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
  const initialLoadRef = useRef(true);
  const animationTimeoutRef = useRef<number | null>(null);
  const activeParticipantsRef = useRef<RaffleParticipant[]>([]);

  const loadRaffle = useCallback(async () => {
    const raffleData = await getRaffleByCode(code);
    setRaffle(raffleData);

    // Evita repetir la animacion de ganadores pasados si recargas la pagina
    if (initialLoadRef.current && raffleData) {
      initialLoadRef.current = false;
      const existingWinners = raffleData.participants.filter(p => p.status === 'winner').map(p => p.id);
      setAnimatedWinnerIds(new Set(existingWinners));
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const actualWinners = useMemo(
    () => (raffle?.participants ?? []).filter((participant) => participant.status === 'winner'),
    [raffle],
  );

  useEffect(() => {
    activeParticipantsRef.current = activeParticipants;
  }, [activeParticipants]);

  // Lógica de la Ruleta y Revelación del Ganador (Secuencial 3, 2, 1)
  const [drawingPlace, setDrawingPlace] = useState<number>(1);
  const [animatingWinner, setAnimatingWinner] = useState<RaffleParticipant | null>(null);
  const [animatedWinnerIds, setAnimatedWinnerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unAnimatedWinner = actualWinners.find(w => !animatedWinnerIds.has(w.id));
    if (unAnimatedWinner && !showWinnerAnimation && !displayedWinner && !animationTimeoutRef.current) {
      setDrawingPlace(unAnimatedWinner.place || 1);
      setAnimatingWinner(unAnimatedWinner);
      setShowWinnerAnimation(true);
      setHideWinnerOverlay(false);
      
      animationTimeoutRef.current = window.setTimeout(() => {
        setShowWinnerAnimation(false);
        setDisplayedWinner(unAnimatedWinner);
        setAnimatedWinnerIds(prev => new Set(prev).add(unAnimatedWinner.id));
          
          if (unAnimatedWinner.place === 1) {
            playWinSound();
          }

          // Cierre automatico para todos los espectadores despues de 6 segundos
          animationTimeoutRef.current = window.setTimeout(() => {
            setHideWinnerOverlay(true);
            setDisplayedWinner(null);
            animationTimeoutRef.current = null;
          }, 6000);
      }, 7000); // 7 segundos de ruleta (frenado gradual)
    } else if (actualWinners.length === 0) {
      setDisplayedWinner(null);
      setShowWinnerAnimation(false);
      setHideWinnerOverlay(false);
      setAnimatedWinnerIds(new Set());
    }
  }, [actualWinners, displayedWinner, showWinnerAnimation, animatedWinnerIds, playWinSound]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

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

  // Animación de nombres para la Ruleta (comienza muy rápido y se va deteniendo)
  useEffect(() => {
    if (!showWinnerAnimation || !animatingWinner || activeParticipantsRef.current.length === 0) return;

    let timeoutId: number;
    const startTime = Date.now();
    const duration = 7000; // Debe coincidir con los 7 segundos de arriba

    const tick = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= duration) {
        setRouletteParticipant(animatingWinner);
        return;
      }
      
      const pool = activeParticipantsRef.current.filter((p) => p.id !== animatingWinner.id);
      const safePool = pool.length > 0 ? pool : activeParticipantsRef.current;
      const randomIndex = Math.floor(Math.random() * safePool.length);
      
      setRouletteParticipant(safePool[randomIndex]);
      playTick();

      // Efecto de frenado más drástico: arranca a velocidad luz (20ms) y frena suave
      const progress = elapsed / duration;
      const nextDelay = 20 + Math.pow(progress, 5) * 800;

      timeoutId = window.setTimeout(tick, nextDelay);
    };

    timeoutId = window.setTimeout(tick, 20);

    return () => window.clearTimeout(timeoutId);
  }, [showWinnerAnimation, animatingWinner, playTick]);

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
    const listToUse = activeParticipants.length > 0 ? activeParticipants : [
      { id: 'd1', displayName: 'Ana P.', assignedNumber: 12 },
      { id: 'd2', displayName: 'Carlos M.', assignedNumber: 45 },
      { id: 'd3', displayName: 'Lucia G.', assignedNumber: 7 },
      { id: 'd4', displayName: 'Pedro S.', assignedNumber: 89 },
      { id: 'd5', displayName: 'Maria L.', assignedNumber: 23 }
    ] as any[];

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * listToUse.length);
      setPreviewParticipant(listToUse[randomIndex]);
    }, 200); // Velocidad constante
    return () => clearInterval(interval);
  }, [activeParticipants]);

  // Utilidad para la animación de las tarjetas (Slot Machine)
  const getParticipantOffset = useCallback((offset: number, target: RaffleParticipant | null) => {
    const listToUse = activeParticipants.length > 0 ? activeParticipants : [
      { id: 'd1', displayName: 'Ana P.', assignedNumber: 12 },
      { id: 'd2', displayName: 'Carlos M.', assignedNumber: 45 },
      { id: 'd3', displayName: 'Lucia G.', assignedNumber: 7 },
      { id: 'd4', displayName: 'Pedro S.', assignedNumber: 89 },
      { id: 'd5', displayName: 'Maria L.', assignedNumber: 23 }
    ] as any[];
    const currentIndex = listToUse.findIndex(p => p.id === target?.id);
    const safeIndex = currentIndex !== -1 ? currentIndex : 0;
    const idx = (safeIndex + offset + listToUse.length * 10) % listToUse.length;
    return listToUse[idx];
  }, [activeParticipants]);

  const canPickWinner = Boolean(raffle?.isAdmin);
  const canEliminate = Boolean(raffle?.staffAccess?.canManageRaffle || raffle?.staffAccess?.canEliminateParticipants);

  const handleManualSelectWinner = async (participantId: string) => {
    if (!raffle) return;
    
    const placeStr = prompt("Ingrese el lugar para este ganador (1, 2, o 3):", "1");
    if (!placeStr) return;
    const place = parseInt(placeStr, 10);
    if (![1,2,3].includes(place)) return alert("Lugar invalido. Debe ser 1, 2 o 3.");
    if (actualWinners.find(w => w.place === place)) return alert(`Ya existe un ganador en el ${place}º lugar.`);
    
    setActionLoadingId(participantId);
    try {
      await selectWinnerForRaffle(raffle.id, participantId, place);
      await loadRaffle();
    } catch (error) {
      console.error('No se pudo seleccionar el ganador:', error);
    } finally {
      setActionLoadingId('');
    }
  };

  const handleRandomDraw = async (place: number) => {
    if (!raffle) return;
    const eligible = activeParticipants.filter(p => p.status !== 'winner');
    if (eligible.length === 0) return alert("No hay participantes elegibles.");
    
    const selected = eligible[Math.floor(Math.random() * eligible.length)];
    setActionLoadingId('drawing');
    try {
      await selectWinnerForRaffle(raffle.id, selected.id, place);
      await loadRaffle();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId('');
    }
  };

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

  const targetParticipant = showWinnerAnimation ? rouletteParticipant : displayedWinner;
  const placeText = drawingPlace === 3 ? '3er Lugar' : drawingPlace === 2 ? '2do Lugar' : '1er Lugar';
  const isFirstPlace = drawingPlace === 1;
  
  const winner1 = actualWinners.find((w) => w.place === 1);
  const winner2 = actualWinners.find((w) => w.place === 2);
  const winner3 = actualWinners.find((w) => w.place === 3);

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      {/* Overlay de Sorteo en Vivo (Ruleta y Confeti) */}
      {(showWinnerAnimation || (displayedWinner && !hideWinnerOverlay)) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md">
          {displayedWinner && !showWinnerAnimation && isFirstPlace && (
            <Confetti width={width} height={height} recycle={false} numberOfPieces={600} gravity={0.15} />
          )}
          
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative flex w-full max-w-2xl flex-col items-center justify-center rounded-[3rem] border ${isFirstPlace ? 'border-yellow-400/50 shadow-[0_0_100px_-20px_rgba(250,204,21,0.5)]' : 'border-slate-500/30 shadow-[0_0_100px_-20px_rgba(148,163,184,0.4)]'} ${animationStyle === 'cards' ? 'bg-transparent border-none shadow-none' : 'bg-white p-10'} text-center transition-colors duration-700`}
          >
            {raffle?.isAdmin && (
              <button
                onClick={() => {
                  setHideWinnerOverlay(true);
                  setDisplayedWinner(null);
                  setShowWinnerAnimation(false);
                  if (animationTimeoutRef.current) {
                    clearTimeout(animationTimeoutRef.current);
                    animationTimeoutRef.current = null;
                  }
                }}
                className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-rose-500 transition"
              >
                ✕
              </button>
            )}

            <p className={`text-xl font-bold uppercase tracking-[0.3em] animate-pulse ${isFirstPlace ? 'text-yellow-500' : 'text-slate-400'}`}>
              {showWinnerAnimation ? `Sorteando ${placeText}...` : (isFirstPlace ? '¡Gran Ganador!' : `¡${placeText}!`)}
            </p>

            {animationStyle === 'roulette' && (
              <div className={`mt-8 font-extrabold text-slate-900 truncate w-full px-4 ${showWinnerAnimation ? 'text-4xl md:text-6xl' : `text-5xl md:text-7xl ${isFirstPlace ? 'text-yellow-500' : 'text-slate-500'} transition-all`}`}>
                #{String(targetParticipant?.assignedNumber || 0).padStart(3, '0')} - {targetParticipant?.displayName || '???'}
              </div>
            )}
            {animationStyle === 'cards' && (
              <div className="flex flex-col items-center mt-6">
                {showWinnerAnimation && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-center gap-2 rounded-full bg-black/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white shadow-black drop-shadow-md"
                  >
                    <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span></span>
                    Nombres Giratorios
                  </motion.div>
                )}
                <div className="relative flex h-[24rem] w-[22rem] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] bg-white p-2 shadow-[0_20px_60px_-15px_rgba(236,42,164,0.4)]">
                  <div className="pointer-events-none absolute left-0 top-0 z-10 h-24 w-full bg-gradient-to-b from-white via-white/80 to-transparent"></div>
                  <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-24 w-full bg-gradient-to-t from-white via-white/80 to-transparent"></div>

                  <div className="flex w-full flex-col items-center gap-3">
                    {[-2, -1, 0, 1, 2].map((offset) => {
                      const p = getParticipantOffset(offset, targetParticipant);
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
                <div className={`mt-6 leading-none font-black tracking-tighter ${showWinnerAnimation ? 'text-[8rem] text-slate-900' : `text-[10rem] ${isFirstPlace ? 'text-yellow-500' : 'text-slate-500'}`}`}>
                  #{String(targetParticipant?.assignedNumber || 0).padStart(3, '0')}
                </div>
                <div className="mt-4 text-4xl font-bold text-slate-700">{targetParticipant?.displayName || '???'}</div>
              </>
            )}

            {!showWinnerAnimation && raffle?.isAdmin && (
              <Button onClick={() => { setHideWinnerOverlay(true); setDisplayedWinner(null); }} className="mt-10 px-10 py-4 text-lg rounded-full shadow-lg">
                Continuar Sorteo
              </Button>
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
              <p className="mt-1 text-sm text-slate-500">Codigo compartible: {raffle.raffleCode} • Premio: {raffle.prizeName || 'Sorpresa'}</p>
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
        {isCountdownActive ? (
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
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 flex flex-col items-center justify-end py-10 px-6 bg-gradient-to-b from-white to-slate-50 rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden min-h-[28rem]"
          >
            <h2 className="absolute top-8 text-2xl md:text-3xl font-black uppercase tracking-widest text-slate-800">Podio de Ganadores</h2>
            <div className="flex items-end justify-center gap-2 sm:gap-8 w-full max-w-3xl">
              {/* Segundo Lugar */}
              <div className="flex flex-col items-center justify-end w-1/3">
                <div className="mb-4 text-center h-16 flex flex-col justify-end">
                  {winner2 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="text-xl md:text-2xl font-black text-slate-900 leading-tight">#{String(winner2.assignedNumber).padStart(3, '0')}</div>
                      <div className="text-sm md:text-base font-bold text-slate-600 truncate w-24 sm:w-36">{winner2.displayName}</div>
                    </motion.div>
                  ) : (
                    <div className="text-sm font-semibold text-slate-400">Por sortear</div>
                  )}
                </div>
                <motion.div initial={{ height: 0 }} animate={{ height: 160 }} className="w-full rounded-t-2xl shadow-[inset_0_4px_10px_rgba(255,255,255,0.5)] flex justify-center pt-4 text-4xl font-black text-white drop-shadow-md bg-gradient-to-b from-slate-400 to-slate-500">2</motion.div>
              </div>
              {/* Primer Lugar */}
              <div className="flex flex-col items-center justify-end w-1/3">
                <div className="mb-4 text-center h-16 flex flex-col justify-end">
                  {winner1 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="text-2xl md:text-3xl font-black text-yellow-600 leading-tight">#{String(winner1.assignedNumber).padStart(3, '0')}</div>
                      <div className="text-base md:text-lg font-bold text-slate-800 truncate w-28 sm:w-40">{winner1.displayName}</div>
                    </motion.div>
                  ) : (
                    <div className="text-sm font-semibold text-slate-400">Por sortear</div>
                  )}
                </div>
                <motion.div initial={{ height: 0 }} animate={{ height: 240 }} className="w-full rounded-t-2xl shadow-[inset_0_4px_10px_rgba(255,255,255,0.5)] flex justify-center pt-4 text-5xl font-black text-white drop-shadow-md bg-gradient-to-b from-yellow-400 to-yellow-600 border-x border-t border-yellow-300">1</motion.div>
              </div>
              {/* Tercer Lugar */}
              <div className="flex flex-col items-center justify-end w-1/3">
                <div className="mb-4 text-center h-16 flex flex-col justify-end">
                  {winner3 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="text-xl md:text-2xl font-black text-slate-900 leading-tight">#{String(winner3.assignedNumber).padStart(3, '0')}</div>
                      <div className="text-sm md:text-base font-bold text-slate-600 truncate w-24 sm:w-36">{winner3.displayName}</div>
                    </motion.div>
                  ) : (
                    <div className="text-sm font-semibold text-slate-400">Por sortear</div>
                  )}
                </div>
                <motion.div initial={{ height: 0 }} animate={{ height: 110 }} className="w-full rounded-t-2xl shadow-[inset_0_4px_10px_rgba(255,255,255,0.3)] flex justify-center pt-3 text-3xl font-black text-white drop-shadow-md bg-gradient-to-b from-orange-400 to-orange-600">3</motion.div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-8">
          {canPickWinner && (
            <Card className="rounded-[2rem] p-6 border-4 border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600 mb-4">Controles de Sorteo (Solo Admin)</p>
              <div className="flex flex-wrap gap-4">
                <Button disabled={!!actualWinners.find(w => w.place === 3) || actionLoadingId !== ''} onClick={() => handleRandomDraw(3)} className="bg-amber-700 hover:bg-amber-800 border-none shadow-lg">Sorteo 3er Lugar</Button>
                <Button disabled={!!actualWinners.find(w => w.place === 2) || actionLoadingId !== ''} onClick={() => handleRandomDraw(2)} className="bg-slate-400 hover:bg-slate-500 border-none shadow-lg">Sorteo 2do Lugar</Button>
                <Button disabled={!!actualWinners.find(w => w.place === 1) || actionLoadingId !== ''} onClick={() => handleRandomDraw(1)} className="bg-yellow-500 hover:bg-yellow-600 border-none shadow-lg text-lg px-8">Sorteo 1er Lugar</Button>
              </div>
            </Card>
          )}

          {raffle?.isStaff && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-pink-100 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(190,24,93,0.15)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ec2aa4]">Visualizacion (Solo Staff)</p>
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
            </motion.div>
          )}

            <Card className="rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ec2aa4]">Participantes</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">Lista desplazable del sorteo</h2>
                </div>
                {actualWinners.length > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    {actualWinners.map(w => (
                      <div key={w.id} className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-700">
                        {w.place}º Lugar: {w.displayName}
                      </div>
                    ))}
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
                            {participant.status === 'winner' && !showWinnerAnimation ? `Ganador ${participant.place}º` : (participant.status === 'winner' ? 'active' : participant.status)}
                          </span>

                          {canPickWinner && participant.status !== 'winner' && participant.status !== 'eliminated' && (
                            <button
                              onClick={() => handleManualSelectWinner(participant.id)}
                              disabled={actionLoadingId === participant.id}
                              className="rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-100 disabled:opacity-60"
                            >
                              {actionLoadingId === participant.id ? 'Guardando...' : 'Elegir Manual'}
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
          {raffle?.isStaff && (
            <Card className="rounded-[2rem] p-6 shadow-sm border border-pink-100">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ec2aa4]">Registro Manual (Solo Staff)</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Agregar participantes</h2>
              <form onSubmit={handleAddParticipant} className="mt-4 grid gap-4 items-start">
                <label className="block text-sm font-medium text-slate-700">
                  Nombre del jugador
                  <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} className="mt-2 w-full rounded-xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100" placeholder="Ej: Maria Lopez" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Numeros (separados por coma)
                  <input type="text" value={addNumbers} onChange={(e) => setAddNumbers(e.target.value)} className="mt-2 w-full rounded-xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100" placeholder="Ej: 5, 12, 45" />
                </label>
                <Button type="submit" disabled={adding} className="mt-2 h-12 w-full px-6 py-2 text-sm">
                  {adding ? 'Agregando...' : 'Agregar Participantes'}
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
