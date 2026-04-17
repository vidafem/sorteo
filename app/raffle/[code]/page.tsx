'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from '@/lib/supabaseClient';
import {
  eliminateParticipantFromRaffle,
  getCurrentUser,
  getRaffleByCode,
  joinRaffle,
  selectWinnerForRaffle,
  type RaffleDetail,
  type RaffleParticipant,
} from '@/lib/queries';

const getCountdownText = (drawAt: string | null) => {
  if (!drawAt) {
    return 'Sin fecha definida';
  }

  const difference = new Date(drawAt).getTime() - Date.now();
  if (difference <= 0) {
    return 'Sorteo finalizado';
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
};

const formatDrawDate = (drawAt: string | null) => {
  if (!drawAt) {
    return 'Aun no se ha programado una fecha de cierre';
  }

  return new Date(drawAt).toLocaleString('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
};

const getNextAvailableNumber = (participants: RaffleParticipant[], maxParticipants: number | null) => {
  const usedNumbers = new Set(participants.map((participant) => participant.assignedNumber));
  const limit = maxParticipants && maxParticipants > 0 ? Math.max(maxParticipants, participants.length + 1) : 999;

  for (let current = 1; current <= limit; current += 1) {
    if (!usedNumbers.has(current)) {
      return current;
    }
  }

  return null;
};

export default function RafflePage() {
  const params = useParams();
  const router = useRouter();
  const { width, height } = useWindowSize();
  const code = String(params.code || '');

  const [raffle, setRaffle] = useState<RaffleDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinNumber, setJoinNumber] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [joinError, setJoinError] = useState('');
  const [, setClockTick] = useState(0);
  
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false);
  const [displayedWinner, setDisplayedWinner] = useState<RaffleParticipant | null>(null);
  const [hideWinnerOverlay, setHideWinnerOverlay] = useState(false);
  const [currentAnimatedNameIndex, setCurrentAnimatedNameIndex] = useState(0);
  const [animationStyle, setAnimationStyle] = useState<'roulette' | 'cards' | 'number'>('cards');
  const [rouletteParticipant, setRouletteParticipant] = useState<RaffleParticipant | null>(null);

  const loadRaffle = useCallback(async () => {
    const [raffleData, user] = await Promise.all([
      getRaffleByCode(code),
      getCurrentUser(),
    ]);

    setCurrentUser(user);
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
    if (!raffle) {
      return;
    }

    const suggestedNumber = getNextAvailableNumber(raffle.participants, raffle.maxParticipants);
    setJoinNumber(suggestedNumber ? String(suggestedNumber) : '');
  }, [raffle]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockTick((value) => value + 1);
    }, 60000);

    return () => window.clearInterval(intervalId);
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

  const countdownText = useMemo(() => getCountdownText(raffle?.drawAt ?? null), [raffle?.drawAt]);
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

      // Efecto de frenado: inicia en 100ms y va subiendo exponencialmente hasta ~700ms
      const progress = elapsed / duration;
      const nextDelay = 100 + Math.pow(progress, 3) * 600;

      timeoutId = window.setTimeout(tick, nextDelay);
    };

    timeoutId = window.setTimeout(tick, 100);

    return () => window.clearTimeout(timeoutId);
  }, [showWinnerAnimation, activeParticipants, actualWinner]);

  // Mini-animación de nombres para la Sala de Espera
  useEffect(() => {
    if (activeParticipants.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAnimatedNameIndex((prev) => (prev + 1) % activeParticipants.length);
    }, 1500); // Cambia el nombre cada 1.5 segundos
    return () => clearInterval(interval);
  }, [activeParticipants.length]);

  const canManage = Boolean(
    raffle?.staffAccess?.canManageRaffle ||
    raffle?.staffAccess?.canPickWinner ||
    raffle?.staffAccess?.canEliminateParticipants,
  );
  const canPickWinner = Boolean(raffle?.staffAccess?.canManageRaffle || raffle?.staffAccess?.canPickWinner);
  const canEliminate = Boolean(raffle?.staffAccess?.canManageRaffle || raffle?.staffAccess?.canEliminateParticipants);
  const suggestedNumber = raffle ? getNextAvailableNumber(raffle.participants, raffle.maxParticipants) : null;
  const joinDisabled = !raffle?.allowPublicJoin || raffle?.status === 'closed' || suggestedNumber === null;

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!raffle) {
      return;
    }

    if (!joinName.trim()) {
      setJoinError('Escribe tu nombre antes de unirte.');
      return;
    }

    const parsedNumber = Number(joinNumber);
    if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
      setJoinError('Ingresa un numero valido para participar.');
      return;
    }

    if (occupiedNumbers.includes(parsedNumber)) {
      setJoinError('Ese numero ya esta ocupado. Elige otro libre.');
      return;
    }

    setJoining(true);
    setJoinError('');
    setJoinMessage('');

    try {
      await joinRaffle(raffle.id, joinName.trim(), parsedNumber);
      await loadRaffle();
      setJoinName('');
      setJoinMessage(`Te uniste correctamente con el numero #${String(parsedNumber).padStart(3, '0')}.`);
    } catch (error: any) {
      setJoinError(error?.message || 'No fue posible registrarte en este sorteo.');
    } finally {
      setJoining(false);
    }
  };

  const handleSelectWinner = async (participantId: string) => {
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
                    <p className="mb-6 text-xl font-bold uppercase tracking-[0.3em] text-white animate-pulse shadow-black drop-shadow-md">Barajando...</p>
                    <div className="relative h-56 w-80 rounded-3xl bg-gradient-to-br from-[#ec2aa4] to-rose-400 p-1.5 shadow-[0_20px_60px_-15px_rgba(236,42,164,0.6)]">
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.3rem] bg-white/95 p-6 backdrop-blur-sm">
                        <div className="text-4xl font-black text-slate-800 truncate w-full">{rouletteParticipant?.displayName || '???'}</div>
                        <div className="mt-6 rounded-full bg-pink-100 px-6 py-2 text-2xl font-bold text-[#ec2aa4]">
                          #{String(rouletteParticipant?.assignedNumber || 0).padStart(3, '0')}
                        </div>
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
                      <p className="mt-2 text-sm font-semibold text-slate-900">{raffle.status}</p>
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
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setAnimationStyle('roulette')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${animationStyle === 'roulette' ? 'bg-[#ec2aa4] text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-pink-50 hover:text-pink-600'}`}>
                    Ruleta
                  </button>
                  <button onClick={() => setAnimationStyle('cards')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${animationStyle === 'cards' ? 'bg-[#ec2aa4] text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-pink-50 hover:text-pink-600'}`}>
                    Tarjetas
                  </button>
                  <button onClick={() => setAnimationStyle('number')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${animationStyle === 'number' ? 'bg-[#ec2aa4] text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-pink-50 hover:text-pink-600'}`}>
                    Solo Numero
                  </button>
                </div>
              </div>
            </div>

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
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ec2aa4]">Ingresar al sorteo</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Reserva tu numero</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Completa tu nombre y el numero que deseas. Los numeros ocupados se muestran abajo para evitar duplicados.
              </p>

              {joinDisabled ? (
                <div className="mt-5 rounded-[1.4rem] bg-[#fff7fb] px-4 py-4 text-sm text-slate-600">
                  Este sorteo no esta disponible para nuevos ingresos en este momento.
                </div>
              ) : (
                <form onSubmit={handleJoin} className="mt-5 space-y-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Nombre del participante
                    <input
                      type="text"
                      value={joinName}
                      onChange={(event) => setJoinName(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Numero a ocupar
                    <input
                      type="number"
                      min="1"
                      value={joinNumber}
                      onChange={(event) => setJoinNumber(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                      placeholder={suggestedNumber ? `Sugerido: ${suggestedNumber}` : 'Sin cupos'}
                      required
                    />
                  </label>

                  {joinError && (
                    <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {joinError}
                    </div>
                  )}

                  {joinMessage && (
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {joinMessage}
                    </div>
                  )}

                  <Button type="submit" disabled={joining} className="w-full px-6 py-4 text-base">
                    {joining ? 'Guardando participacion...' : 'Unirme al sorteo'}
                  </Button>
                </form>
              )}
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
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

          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 }}>
            <Card className="rounded-[2rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ec2aa4]">Acceso interno</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Controles del equipo</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {canManage
                  ? `Estas viendo controles de staff como ${raffle.staffAccess?.role}. Puedes elegir ganadores o eliminar participantes segun tus permisos.`
                  : currentUser
                    ? 'Tienes sesion iniciada, pero no perteneces al staff de este sorteo.'
                    : 'Inicia sesion con un usuario de staff para ver los controles internos del sorteo.'}
              </p>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
