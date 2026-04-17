'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRaffle, getCurrentUser, getMyRaffles, deleteRaffle, type CreateRaffleInput, type RaffleSummary } from '@/lib/queries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

const formatDrawDate = (value: string | null) => {
  if (!value) {
    return 'Sin fecha programada';
  }

  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getStatusLabel = (status: RaffleSummary['status']) => {
  switch (status) {
    case 'active':
      return 'Activo';
    case 'scheduled':
      return 'Programado';
    case 'closed':
      return 'Cerrado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return 'Borrador';
  }
};

const getStatusClasses = (status: RaffleSummary['status']) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'scheduled':
      return 'bg-amber-100 text-amber-700';
    case 'closed':
      return 'bg-slate-200 text-slate-700';
    case 'cancelled':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [raffles, setRaffles] = useState<RaffleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateRaffleInput>({
    title: '',
    description: '',
    prizeName: '',
    drawAt: '',
    maxParticipants: null,
  });
  const router = useRouter();

  const loadDashboard = useCallback(async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      router.push('/');
      return;
    }

    setUser(currentUser);
    const raffleRows = await getMyRaffles();
    setRaffles(raffleRows);
  }, [router]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadDashboard();
      } catch (loadError: any) {
        setError(loadError?.message || 'No se pudo cargar tu dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadDashboard]);

  const totalParticipants = useMemo(
    () => raffles.reduce((total, raffle) => total + raffle.participantCount, 0),
    [raffles],
  );

  const handleCopyCode = async (raffleCode: string) => {
    await navigator.clipboard.writeText(raffleCode);
    setCopyFeedback(`Codigo ${raffleCode} copiado`);
    window.setTimeout(() => setCopyFeedback(''), 2200);
  };

  const handleCreateRaffle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.title?.trim()) {
      setError('Escribe al menos un titulo para el sorteo.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const createdRaffle = await createRaffle({
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        prizeName: formData.prizeName?.trim() || '',
        drawAt: formData.drawAt ? new Date(formData.drawAt).toISOString() : null,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : null,
      });

      // Redirigir inmediatamente a la pantalla del sorteo para agregar participantes
      router.push(`/raffle/${createdRaffle.raffleCode}`);
    } catch (saveError: any) {
      setError(saveError?.message || 'No se pudo crear el sorteo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRaffle = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este sorteo? Esta acción no se puede deshacer y borrará todos los participantes.')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteRaffle(id);
      await loadDashboard();
    } catch (deleteError: any) {
      setError(deleteError?.message || 'No se pudo eliminar el sorteo.');
    } finally {
      setDeletingId('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff7fb]">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-pink-100 border-t-[#ec2aa4]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <header className="border-b border-pink-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#ec2aa4]">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Tus sorteos activos</h1>
            <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/')}
              className="rounded-full border border-pink-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-pink-50"
            >
              Volver al inicio
            </button>
            <Button onClick={() => setShowCreateForm((current) => !current)} className="px-6 py-3 text-sm">
              {showCreateForm ? 'Cerrar formulario' : 'Crear nuevo sorteo'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[1.8rem] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Sorteos</p>
            <div className="mt-3 text-4xl font-bold text-slate-950">{raffles.length}</div>
            <p className="mt-2 text-sm text-slate-500">Cantidad total de sorteos creados por tu cuenta.</p>
          </Card>

          <Card className="rounded-[1.8rem] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Participantes</p>
            <div className="mt-3 text-4xl font-bold text-slate-950">{totalParticipants}</div>
            <p className="mt-2 text-sm text-slate-500">Personas registradas entre todos tus sorteos.</p>
          </Card>

          <Card className="rounded-[1.8rem] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Codigos listos</p>
            <div className="mt-3 text-4xl font-bold text-slate-950">
              {raffles.filter((raffle) => raffle.raffleCode).length}
            </div>
            <p className="mt-2 text-sm text-slate-500">Cada sorteo tiene un codigo visible para compartir.</p>
          </Card>
        </section>

        {showCreateForm && (
          <section className="mt-8">
            <Card className="rounded-[2rem] border border-pink-100 bg-white p-6">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ec2aa4]">Crear sorteo</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Configura un nuevo sorteo</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Al crear el sorteo se generara automaticamente un codigo listo para copiar y compartir.
                </p>
              </div>

              <form onSubmit={handleCreateRaffle} className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Titulo
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                    placeholder="Ej: Sorteo Smart TV"
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Premio
                  <input
                    type="text"
                    value={formData.prizeName || ''}
                    onChange={(event) => setFormData((current) => ({ ...current, prizeName: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                    placeholder="Ej: Smart TV 50 pulgadas"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Descripcion
                  <textarea
                    value={formData.description || ''}
                    onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                    className="mt-2 min-h-28 w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                    placeholder="Describe las reglas o el objetivo del sorteo"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Fecha y hora del sorteo
                  <input
                    type="datetime-local"
                    value={formData.drawAt || ''}
                    onChange={(event) => setFormData((current) => ({ ...current, drawAt: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Maximo de participantes
                  <input
                    type="number"
                    min="1"
                    value={formData.maxParticipants ?? ''}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        maxParticipants: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                    placeholder="Opcional"
                  />
                </label>

                {error && (
                  <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
                    {error}
                  </div>
                )}

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <Button type="submit" disabled={saving} className="px-6 py-3 text-sm">
                    {saving ? 'Creando sorteo...' : 'Guardar sorteo'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-full border border-pink-100 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-pink-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          </section>
        )}

        {copyFeedback && (
          <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {copyFeedback}
          </div>
        )}

        <section className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ec2aa4]">Mis sorteos</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Sorteos creados</h2>
            </div>
          </div>

          {raffles.length === 0 ? (
            <Card className="rounded-[2rem] p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-50 text-2xl font-bold text-[#ec2aa4]">
                SR
              </div>
              <h3 className="mt-6 text-2xl font-bold text-slate-950">Aun no tienes sorteos</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Crea tu primer sorteo para obtener un codigo visible, compartirlo con participantes y empezar a recibir numeros ocupados en tiempo real.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowCreateForm(true)} className="px-6 py-3 text-sm">
                  Crear primer sorteo
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {raffles.map((raffle, index) => (
                <motion.div
                  key={raffle.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Card className="rounded-[2rem] p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-950">{raffle.title}</h3>
                        <p className="mt-2 max-w-xl text-sm text-slate-500">
                          {raffle.description || 'Sin descripcion por ahora.'}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(raffle.status)}`}>
                        {getStatusLabel(raffle.status)}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] bg-[#fff7fb] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Codigo visible</p>
                        <div className="mt-2 flex items-center gap-3">
                          <code className="rounded-full bg-white px-4 py-2 text-sm font-bold tracking-[0.26em] text-[#ec2aa4]">
                            {raffle.raffleCode}
                          </code>
                          <button
                            onClick={() => handleCopyCode(raffle.raffleCode)}
                            className="rounded-full border border-pink-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-pink-50"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] bg-[#fff7fb] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Participantes</p>
                        <div className="mt-2 text-2xl font-bold text-slate-950">{raffle.participantCount}</div>
                        <p className="mt-1 text-sm text-slate-500">Codigo listo para compartir con todos.</p>
                      </div>

                      <div className="rounded-[1.4rem] bg-[#fff7fb] p-4 sm:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sorteo programado</p>
                        <p className="mt-2 text-sm font-medium text-slate-700">{formatDrawDate(raffle.drawAt)}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Premio: {raffle.prizeName || 'Aun no definido'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button onClick={() => router.push(`/raffle/${raffle.raffleCode}`)} className="px-5 py-3 text-sm">
                        Agregar participantes
                      </Button>
                      <button
                        onClick={() => handleCopyCode(raffle.raffleCode)}
                        className="rounded-full border border-pink-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-pink-50"
                      >
                        Compartir codigo
                      </button>
                      <button
                        onClick={() => handleDeleteRaffle(raffle.id)}
                        disabled={deletingId === raffle.id}
                        className="rounded-full border border-rose-100 bg-white px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        {deletingId === raffle.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
