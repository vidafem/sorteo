'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, login, register } from '@/lib/queries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PlatformAnimator from '@/components/PlatformAnimator';
import { motion } from 'framer-motion';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '' });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const router = useRouter();

  const appCards = [
    { title: 'Sorteo en Instagram', description: 'Elige comentarios ganadores de tus publicaciones.', icon: 'IG', tag: 'Popular', color: 'bg-pink-100 text-pink-700' },
    { title: 'Sorteo en Facebook', description: 'Selecciona ganadores de tu comunidad.', icon: 'FB', tag: 'Social', color: 'bg-blue-100 text-blue-700' },
    { title: 'Sorteo en TikTok', description: 'Dinamiza tus videos y gana engagement.', icon: 'TT', tag: 'Video', color: 'bg-slate-100 text-slate-800' },
  ];

  const testimonials = [
    { name: 'Maria Rodriguez', handle: '@mariarod_oficial', quote: 'Genial para mis dinámicas en Instagram, muy fácil de usar.' },
    { name: 'Carlos López', handle: '@carloslopez.mx', quote: 'Mis seguidores aman los sorteos, ganamos mucho engagement.' },
    { name: 'Sofia Navarro', handle: '@sofianavarro_co', quote: 'La mejor herramienta para hacer sorteos transparentes y profesionales.' },
  ];

  const brandLogos = ['Influencers', 'E-Commerce', 'Agencias', 'Pymes', 'Negocios', 'Comunidades', 'Marcas', 'Creadores'];
  const socialItems = ['Instagram', 'Facebook', 'TikTok'];
  const steps = [
    {
      title: 'Crea tu sorteo',
      text: 'Ingresa el nombre, fecha, hora y establece los participantes de tu sorteo.',
    },
    {
      title: 'Comparte el código',
      text: 'Genera un código único que compartirás con tu comunidad para unirse.',
    },
    {
      title: 'Selecciona al ganador',
      text: 'Con un clic, la plataforma elige el ganador de forma aleatoria y transparente.',
    },
    {
      title: 'Anuncia resultados',
      text: 'Descarga el certificado del ganador y comparte con tu audiencia.',
    },
  ];
  const faqs = [
    {
      question: '¿Qué es AppSorteos?',
      answer: 'Es una plataforma online para crear sorteos justos, transparentes y profesionales. Perfecta para influencers, empresas y comunidades que quieren hacer dinámicas en redes sociales.',
    },
    {
      question: '¿Puedo crear un sorteo gratis?',
      answer: 'Sí, completamente gratis. Solo necesitas registrarte, crear un sorteo y compartir el código con tu comunidad para que participen.',
    },
    {
      question: '¿Cuántos participantes puedo tener?',
      answer: 'Sin límite. Puedes tener desde 10 hasta miles de participantes en un solo sorteo. La plataforma selecciona al ganador de forma aleatoria.',
    },
    {
      question: '¿Es seguro y transparente?',
      answer: 'Totalmente. Todos los procesos se registran, puedes descargar certificados del sorteo y compartir los resultados con tu audiencia sin dudas.',
    },
  ];

  const filteredAppCards = appCards.filter((card) =>
    `${card.title} ${card.description}`.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // No autenticado
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (modalType === 'login') {
        await login(formData.email, formData.password);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setShowModal(false);
      } else {
        await register(formData.email, formData.password, formData.nombre);
        setModalType('login');
        setFormData({ ...formData, password: '' });
      }
    } catch (err: any) {
      setError(err.message || 'Error en la operacion');
    }
  };

  const openModal = (type: 'login' | 'register') => {
    setModalType(type);
    setShowModal(true);
    setError('');
    setFormData({ email: '', password: '', nombre: '' });
  };

  const handleHeroJoin = () => {
    const normalizedCode = searchQuery.trim().toUpperCase();

    if (!normalizedCode) {
      router.push('/join');
      return;
    }

    router.push(`/raffle/${normalizedCode}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff7fb]">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-pink-100 border-t-[#ec2aa4]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,135,208,0.24),_transparent_32%),radial-gradient(circle_at_85%_12%,_rgba(255,216,236,0.85),_transparent_22%)]" />
      <div className="pointer-events-none absolute left-[-5rem] top-[30rem] h-72 w-72 rounded-full bg-pink-200/45 blur-[110px]" />
      <div className="pointer-events-none absolute right-[-6rem] top-[9rem] h-96 w-96 rounded-full bg-fuchsia-200/40 blur-[130px]" />

      <header className="relative z-20 border-b border-pink-100/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button className="flex items-center gap-3 text-slate-950">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ec2aa4] to-[#ff7aa2] text-xl text-white shadow-[0_14px_35px_-16px_rgba(236,42,164,0.85)]">
              S
            </div>
            <div>
              <div className="text-lg font-bold">AppSorteos</div>
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Supersorteo</div>
            </div>
          </button>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 xl:flex">
            <button className="transition hover:text-[#ec2aa4]">Aplicaciones</button>
            <button className="transition hover:text-[#ec2aa4]">Como funciona</button>
            <button className="transition hover:text-[#ec2aa4]">Beneficios</button>
            <button className="transition hover:text-[#ec2aa4]">FAQ</button>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <div className="flex items-center gap-3 rounded-full border border-pink-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-[0_18px_40px_-28px_rgba(190,24,93,0.45)]">
                <span className="hidden max-w-[11rem] truncate sm:inline">{user.email}</span>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="rounded-full bg-pink-50 px-4 py-2 font-semibold text-[#d61f96] transition hover:bg-pink-100"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-pink-100 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Salir
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => openModal('login')}
                  className="rounded-full px-4 py-2 font-semibold text-slate-700 transition hover:bg-pink-50"
                >
                  Ingresar
                </button>
                <Button onClick={() => openModal('register')} className="px-5 py-3 text-sm">
                  Crear cuenta
                </Button>
              </>
            )}
            <span className="hidden text-slate-400 xl:inline">ES</span>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="bg-[#ef269f] text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 text-center lg:py-20">
            <PlatformAnimator />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              <div className="flex flex-col overflow-hidden rounded-[1.65rem] border border-white/30 bg-white p-2 shadow-[0_28px_80px_-34px_rgba(122,16,84,0.7)] sm:flex-row">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ingresa el codigo de tu sorteo"
                  className="h-14 flex-1 rounded-[1.2rem] border-0 bg-transparent px-5 text-base text-slate-900 outline-none placeholder:text-slate-400"
                />
                <Button
                  onClick={handleHeroJoin}
                  className="h-14 min-w-[10rem] rounded-[1.2rem] px-6 py-3 text-sm"
                >
                  Ingresar
                </Button>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => (user ? router.push('/dashboard') : openModal('login'))}
                  className="rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white/95 backdrop-blur-sm"
                >
                  Crear nuevo sorteo
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/90">
                {socialItems.map((item) => (
                  <span key={item} className="rounded-full border border-white/25 px-4 py-2 backdrop-blur-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#ec2aa4]">Plataformas Disponibles</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Sorteos en tus redes sociales favoritas</h2>
            <p className="mt-3 text-base text-slate-600">
              Elige dónde quieres hacer tu sorteo y crea dinámicas profesionales en segundos.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredAppCards.map((card) => (
              <Card
                key={card.title}
                className="rounded-[1.8rem] border border-pink-100 bg-white/95 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_-42px_rgba(190,24,93,0.55)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold ${card.color}`}>
                    {card.icon}
                  </div>
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {card.tag}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[#ec2aa4]">
                  <span>Disponible</span>
                  <span aria-hidden="true">{'>'}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button onClick={() => (user ? router.push('/dashboard') : openModal('register'))} className="px-7 py-4 text-sm">
              Ver todas las apps
            </Button>
          </div>
        </section>

        <section className="border-y border-pink-100 bg-white/60">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 text-center md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.handle} className="rounded-[1.8rem] bg-white px-6 py-7 shadow-[0_22px_60px_-40px_rgba(190,24,93,0.4)]">
                <div className="text-sm tracking-[0.2em] text-amber-500">5/5 rating</div>
                <p className="mt-3 text-base font-semibold text-slate-900">{item.quote}</p>
                <div className="mt-4 text-sm text-slate-500">{item.name}</div>
                <div className="text-sm text-slate-400">{item.handle}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-[2.25rem] border border-pink-100 bg-white px-6 py-10 shadow-[0_36px_90px_-54px_rgba(190,24,93,0.5)] lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#ec2aa4]">Confía en AppSorteos</p>
              <h2 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">
                Usado por miles de creadores y empresas
              </h2>
              <p className="mt-4 text-slate-600">
                Nuestros usuarios hacen sorteos transparentes, justos y profesionales todos los días.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {brandLogos.map((logo) => (
                <span
                  key={logo}
                  className="rounded-full border border-pink-100 bg-[#fff8fc] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-14 px-6 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#ec2aa4]">Fácil de Usar</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">
              Crea tu primer sorteo en 4 pasos simples
            </h2>
            <div className="mt-8 space-y-4">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-[1.75rem] border border-pink-100 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(190,24,93,0.45)]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-sm font-bold text-[#ec2aa4]">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-pink-100 blur-3xl" />
            <Card className="relative overflow-hidden rounded-[2.2rem] border border-pink-100 bg-gradient-to-br from-white via-[#fff7fb] to-[#ffe7f3] p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  'from-pink-500 to-rose-400',
                  'from-purple-500 to-fuchsia-400',
                  'from-orange-400 to-pink-400',
                  'from-emerald-400 to-lime-400',
                  'from-sky-400 to-cyan-400',
                  'from-fuchsia-500 to-pink-400',
                  'from-amber-400 to-orange-400',
                  'from-slate-900 to-slate-700',
                  'from-rose-300 to-pink-300',
                ].map((gradient, index) => (
                  <div key={`${gradient}-${index}`} className={`aspect-[0.95] rounded-[1.6rem] bg-gradient-to-br ${gradient} p-4 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)]`}>
                    <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                      Card {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#ec2aa4]">Selección Transparente</p>
            <h2 className="mt-4 max-w-xl text-3xl font-bold text-slate-950 sm:text-4xl">
              Elige ganadores de forma justa y aleatoria
            </h2>
            <p className="mt-4 max-w-xl text-slate-600">
              Todos los sorteos son registrados, verificables y puedes compartir los resultados con tu comunidad sin ninguna duda.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              {[
                'Selección 100% aleatoria y transparente',
                'Certificados descargables de cada sorteo',
                'Historial completo de todos tus sorteos',
                'Códigos únicos para compartir con tu comunidad',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-50 text-[11px] font-bold text-[#ec2aa4]">OK</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => (user ? router.push('/dashboard') : openModal('register'))} className="mt-8 px-7 py-4 text-sm">
              Pruebalo Gratis
            </Button>
          </div>

          <div className="order-1 lg:order-2">
            <Card className="rounded-[2.2rem] border border-pink-100 bg-gradient-to-br from-[#c0288f] via-[#e33ea1] to-[#ff75a0] p-8 text-white shadow-[0_40px_90px_-50px_rgba(168,15,101,0.9)]">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Rafflys</span>
                <span className="rounded-full bg-white/15 px-3 py-1">Settings</span>
              </div>
              <div className="mt-8 rounded-[1.8rem] bg-white/14 p-6 backdrop-blur-sm">
                <div className="text-2xl font-bold">792 comentarios validos</div>
                <p className="mt-2 text-sm text-white/80">Configura reglas, exclusiones y condiciones visualmente.</p>
                <div className="mt-6 grid gap-3">
                  {['Solo seguidores', 'Una participacion por usuario', 'Incluir hashtag', 'Validar menciones'].map((item, index) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl bg-white/12 px-4 py-3">
                      <span>{item}</span>
                      <span className={`flex h-6 w-11 items-center rounded-full p-1 ${index < 2 ? 'justify-end bg-lime-300/90' : 'justify-start bg-white/20'}`}>
                        <span className="h-4 w-4 rounded-full bg-white" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-8 lg:grid-cols-2 lg:items-center">
          <div>
            <Card className="overflow-hidden rounded-[2.2rem] border border-pink-100 bg-gradient-to-br from-[#fff7fb] via-white to-[#fff0f8] p-8">
              <div className="flex gap-4">
                {['#ff8ab8', '#8bd64c', '#6ecbf5'].map((color, index) => (
                  <div key={color} className="h-40 flex-1 rounded-[1.5rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]" style={{ background: `linear-gradient(135deg, ${color}, #ffffff)` }}>
                    <div className="p-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Certificado {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#ec2aa4]">Certificación</p>
            <h2 className="mt-4 max-w-xl text-3xl font-bold text-slate-950 sm:text-4xl">
              Descarga certificados profesionales de tus sorteos
            </h2>
            <p className="mt-4 max-w-xl text-slate-600">
              Cada sorteo genera un certificado que puedes compartir, imprimir o publicar para comprobar la transparencia del proceso.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3"><span className="text-[#ec2aa4]">-</span><span>Certificado con fecha, hora y ganador</span></div>
              <div className="flex items-center gap-3"><span className="text-[#ec2aa4]">-</span><span>Descargar como imagen o PDF</span></div>
              <div className="flex items-center gap-3"><span className="text-[#ec2aa4]">-</span><span>Compartir en redes sociales en 1 clic</span></div>
            </div>
            <Button onClick={() => router.push('/join')} className="mt-8 px-7 py-4 text-sm">
              Prueba Gratis
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#ec2aa4]">Preguntas Frecuentes</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Respuestas rapidas para tu plataforma</h2>
          </div>
          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question} className="overflow-hidden rounded-[1.7rem] border border-pink-100 bg-white shadow-[0_20px_55px_-42px_rgba(190,24,93,0.4)]">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-lg font-bold text-slate-900">{faq.question}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-xl font-medium text-[#ec2aa4]">
                      {isOpen ? '-' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm leading-7 text-slate-600">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-pink-100 bg-white/70">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ec2aa4] to-[#ff7aa2] text-xl text-white">
                  S
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-950">AppSorteos</div>
              <div className="text-sm text-slate-500">Plataforma profesional para sorteos en redes sociales.</div>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
                Crea sorteos justos, transparentes y profesionales en Instagram, Facebook y TikTok. Elige ganadores con confianza.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-slate-400">Producto</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>Crear sorteo</div>
                <div>Unirse a sorteo</div>
                <div>Mi dashboard</div>
                <div>Certificados</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-slate-400">Ayuda</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>Preguntas Frecuentes</div>
                <div>Centro de Ayuda</div>
                <div>Blog</div>
                <div>Contacto</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-slate-400">Mi Cuenta</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <button onClick={() => openModal('login')} className="block text-left transition hover:text-[#ec2aa4]">Ingresar</button>
                <button onClick={() => openModal('register')} className="block text-left transition hover:text-[#ec2aa4]">Crear cuenta</button>
                <button onClick={() => router.push('/join')} className="block text-left transition hover:text-[#ec2aa4]">Unirme a un sorteo</button>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-[2rem] border border-pink-100 bg-white p-8 shadow-[0_36px_80px_-42px_rgba(15,23,42,0.45)]"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 rounded-full bg-pink-50 p-2 text-slate-500 transition hover:bg-pink-100"
            >
              X
            </button>
            <h3 className="mb-2 text-center text-2xl font-bold text-slate-900">
              {modalType === 'login' ? 'Inicia sesion' : 'Crea tu cuenta'}
            </h3>
            <p className="mb-6 text-center text-sm text-slate-500">
              Accede a tus sorteos con la misma logica actual y una interfaz mas cuidada.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {modalType === 'register' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Contrasena</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-2xl border border-pink-100 bg-[#fff9fc] px-4 py-3 text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-pink-50 px-4 py-3 text-sm text-pink-700">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full rounded-2xl px-5 py-4 text-base">
                {modalType === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-600">
              <button
                onClick={() => setModalType(modalType === 'login' ? 'register' : 'login')}
                className="font-semibold text-fuchsia-600 hover:text-fuchsia-700"
              >
                {modalType === 'login' ? 'No tienes cuenta? Registrate' : 'Ya tienes cuenta? Inicia sesion'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
