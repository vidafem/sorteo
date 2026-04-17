import { supabase } from "./supabaseClient";

export interface Concursante {
  id: string | number;
  nombre: string;
  ticket_bloqueado: number;
  es_ganador: boolean;
}

export const getConcursantes = async (): Promise<Concursante[]> => {
  if (!supabase) throw new Error("Supabase no está configurado");
  const { data, error } = await supabase.from("concursantes").select("*");
  if (error) throw error;
  return data as Concursante[];
};

export const crearConcursante = async (nuevo: Omit<Concursante, "id">) => {
  if (!supabase) throw new Error("Supabase no está configurado");
  const { error } = await supabase.from("concursantes").insert([nuevo]);
  if (error) throw error;
};

export const getGanador = async (): Promise<Concursante | null> => {
  if (!supabase) throw new Error("Supabase no está configurado");
  const { data, error } = await supabase
    .from("concursantes")
    .select("*")
    .eq("es_ganador", true)
    .single();

  if (error || !data) return null;
  return data as Concursante;
};