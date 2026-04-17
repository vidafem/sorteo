export default function WinnerReveal({ nombre }: { nombre: string }) {
  return (
    <div className="text-center mt-10">
      <h2 className="text-3xl">🎉 Ganador 🎉</h2>
      <p className="text-xl mt-3">{nombre}</p>
    </div>
  );
}