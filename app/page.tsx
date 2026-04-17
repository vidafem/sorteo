'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, login, register } from '@/lib/queries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '' });
  const [error, setError] = useState('');
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

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
      setError(err.message || 'Error en la operación');
    }
  };

  const openModal = (type: 'login' | 'register') => {
    setModalType(type);
    setShowModal(true);
    setError('');
    setFormData({ email: '', password: '', nombre: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-10 w-32 h-32 bg-red-500/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-500/20 rounded-full blur-lg"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white"
          >
            🎰 <span className="bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">SUPER</span>SORTEO
          </motion.h1>

          <div className="flex gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-white">Hola, {user.email}</span>
                <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                  Cerrar Sesión
                </Button>
              </div>
            ) : (
              <>
                <Button onClick={() => openModal('login')} className="bg-white/10 hover:bg-white/20 text-white border border-white/20">
                  Iniciar Sesión
                </Button>
                <Button onClick={() => openModal('register')} className="bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600">
                  Crear Cuenta
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            ¡La Mejor Plataforma de <span className="text-yellow-400">Sorteos</span> en Línea!
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Crea sorteos emocionantes, invita a tus amigos y gana premios increíbles.
            Miles de usuarios ya confían en nosotros.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="text-4xl font-bold text-yellow-400 mb-2">🎯</div>
              <div className="text-3xl font-bold text-white">15,420</div>
              <div className="text-gray-300">Sorteos Realizados</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="text-4xl font-bold text-yellow-400 mb-2">👥</div>
              <div className="text-3xl font-bold text-white">89,247</div>
              <div className="text-gray-300">Usuarios Activos</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="text-4xl font-bold text-yellow-400 mb-2">🏆</div>
              <div className="text-3xl font-bold text-white">2,341</div>
              <div className="text-gray-300">Premios Entregados</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Raffle Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="p-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
              <div className="text-center">
                <div className="text-6xl mb-4">🎲</div>
                <h3 className="text-2xl font-bold text-white mb-4">Crear Sorteo</h3>
                <p className="text-gray-300 mb-6">
                  Organiza tu propio sorteo, establece reglas y premios.
                  Invita a participantes y haz que sea inolvidable.
                </p>
                <Button
                  onClick={() => user ? router.push('/dashboard') : openModal('register')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {user ? 'Ir al Dashboard' : 'Comenzar Ahora'}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Join Raffle Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="p-8 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300">
              <div className="text-center">
                <div className="text-6xl mb-4">🎫</div>
                <h3 className="text-2xl font-bold text-white mb-4">Unirse a Sorteo</h3>
                <p className="text-gray-300 mb-6">
                  Ingresa el código del sorteo y participa por premios increíbles.
                  ¡Es rápido y fácil!
                </p>
                <Button
                  onClick={() => router.push('/join')}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  Unirse Ahora
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Winners Animation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-8">🏆 Ganadores Recientes</h3>
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-8 overflow-hidden">
              <motion.div
                animate={{ x: [0, -100, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="flex space-x-8 whitespace-nowrap"
              >
                {[
                  { name: "María G.", prize: "iPhone 15", emoji: "📱" },
                  { name: "Carlos R.", prize: "$500", emoji: "💰" },
                  { name: "Ana L.", prize: "PlayStation 5", emoji: "🎮" },
                  { name: "Pedro M.", prize: "Viaje a Cancún", emoji: "✈️" },
                  { name: "Laura S.", prize: "MacBook Pro", emoji: "💻" },
                ].map((winner, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-white/10 rounded-lg px-4 py-2">
                    <span className="text-2xl">{winner.emoji}</span>
                    <div className="text-left">
                      <div className="text-white font-semibold">{winner.name}</div>
                      <div className="text-yellow-400 text-sm">{winner.prize}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
              {modalType === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h3>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {modalType === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                {modalType === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setModalType(modalType === 'login' ? 'register' : 'login')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {modalType === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
