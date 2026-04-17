'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/queries';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#ff2680]">Cargando...</div>;
  }

  if (user) {
    // Usuario autenticado
    return (
      <main className="min-h-screen bg-[#ff2680] text-white">
        <div className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-40 bg-white/10 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-white/5 blur-3xl" />

          <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6">
            <div className="text-xl font-black tracking-tight uppercase">Supersorteo</div>
            <div className="flex items-center gap-3">
              <span className="text-white/90">Bienvenido, {user.email}</span>
              <a href="/sorteo" className="rounded-full border border-white/30 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition">Ver Sorteo</a>
              <a href="/admin" className="rounded-full bg-white text-pink-600 px-5 py-2 text-sm font-semibold shadow-lg shadow-pink-500/20 hover:bg-gray-100 transition">Panel Admin</a>
              <button onClick={handleLogout} className="rounded-full border border-white/30 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition">Cerrar Sesión</button>
            </div>
          </nav>

          <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 sm:py-28 text-center">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-8">¡Bienvenido al Sorteo!</h1>
            <p className="max-w-xl mx-auto text-lg text-white/85 leading-8 mb-8">
              Estás autenticado. Puedes ver el sorteo en vivo o acceder al panel de administración.
            </p>
            <div className="space-x-4">
              <a href="/sorteo" className="rounded-full bg-white text-pink-600 px-7 py-4 text-base font-semibold shadow-lg shadow-pink-500/20 hover:bg-gray-100 transition inline-block">Ir al Sorteo</a>
              <a href="/admin" className="rounded-full border border-white/30 px-7 py-4 text-base text-white/90 hover:bg-white/10 transition inline-block">Panel Admin</a>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // Usuario no autenticado - landing page
  return (
    <main className="min-h-screen bg-[#ff2680] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-40 bg-white/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-white/5 blur-3xl" />

        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6">
          <div className="text-xl font-black tracking-tight uppercase">Supersorteo</div>
          <div className="flex items-center gap-3">
            <a href="/login" className="rounded-full border border-white/30 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition">Ingresar</a>
            <a href="/register" className="rounded-full bg-white text-pink-600 px-5 py-2 text-sm font-semibold shadow-lg shadow-pink-500/20 hover:bg-gray-100 transition">Crear cuenta</a>
          </div>
        </nav>

        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.3em] text-white/90 shadow-lg shadow-pink-500/20">
                Nueva experiencia
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">Supersorteo</h1>
                <p className="max-w-xl text-lg text-white/85 leading-8">
                  Crea sorteos rápidos y visuales para tu comunidad. Está en pañales, pero ya puedes lucir un diseño moderno y potente.
                </p>
              </div>

              <div className="space-y-5">
                <div className="rounded-full bg-white/15 border border-white/20 shadow-[0_35px_120px_-80px_rgba(255,255,255,0.8)]">
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl">📷</span>
                    <input
                      type="text"
                      placeholder="Ingresa @username o URL del post"
                      className="flex-1 min-w-0 rounded-full border border-white/20 bg-white/10 px-5 py-4 text-white placeholder:text-white/60 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                    <button className="rounded-full bg-white text-pink-600 px-7 py-4 text-base font-semibold shadow-lg shadow-pink-500/20 hover:bg-gray-100 transition">Comenzar</button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 text-white/90 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">Instagram</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">Facebook</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">TikTok</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">YouTube</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">Twitter</span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-pink-800/40 backdrop-blur-xl">
              <div className="space-y-4">
                <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80">Preview</div>
                <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-6 text-center">
                  <div className="mb-5 rounded-3xl bg-white/10 p-6 text-left">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/70">Demostración</p>
                    <p className="mt-4 text-4xl font-semibold text-white"># 0 8 4 2 1</p>
                    <p className="mt-2 text-sm text-white/65">Ganador en proceso</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-5 text-left">
                    <p className="text-sm text-white/70">Próximo paso</p>
                    <p className="mt-3 text-lg font-semibold text-white">Personaliza tu sorteo y muestra resultados como un profesional.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-white text-slate-900 pb-20">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-pink-600">Apps de sorteos más usadas</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">Estilo profesional para tu próximo sorteo</h2>
            <p className="mt-4 text-lg text-slate-600 leading-8">
              Crea una presencia visual impecable sin necesidad de funcionalidad completa aún. Este diseño ya tiene el carapacho que necesitas.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
              <h3 className="text-xl font-semibold text-slate-900">Diseño rápido</h3>
              <p className="mt-3 text-slate-600">Hero llamativo con CTA y caja de entrada clara.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
              <h3 className="text-xl font-semibold text-slate-900">Responsive</h3>
              <p className="mt-3 text-slate-600">Funciona bien en escritorio y dispositivos móviles.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
              <h3 className="text-xl font-semibold text-slate-900">Tono premium</h3>
              <p className="mt-3 text-slate-600">Gradientes y efectos sutiles para un look moderno.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
              <p className="mt-3 text-slate-600">Colores vibrantes y componentes elegantes.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
