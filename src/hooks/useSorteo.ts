import { useState } from "react";

export const useSorteo = () => {
  const [numero, setNumero] = useState<number | null>(null);
  const [animando, setAnimando] = useState(false);

  return { numero, setNumero, animando, setAnimando };
};