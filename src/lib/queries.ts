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

export const marcarGanador = async (id: string | number) => {
  if (!supabase) throw new Error("Supabase no está configurado");
  // Primero, quitar el ganador anterior
  await supabase.from("concursantes").update({ es_ganador: false }).eq("es_ganador", true);
  // Marcar el nuevo ganador
  const { error } = await supabase.from("concursantes").update({ es_ganador: true }).eq("id", id);
  if (error) throw error;
};

export const login = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase no está configurado");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const register = async (email: string, password: string, nombre: string) => {
  if (!supabase) throw new Error("Supabase no está configurado");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  if (!supabase) throw new Error("Supabase no está configurado");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  if (!supabase) throw new Error("Supabase no está configurado");
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};