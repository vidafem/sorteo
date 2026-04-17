import { supabase } from "./supabaseClient";

export interface Concursante {
  id: string | number;
  nombre: string;
  ticket_bloqueado: number;
  es_ganador: boolean;
}

export interface RaffleParticipant {
  id: string;
  raffleId: string;
  displayName: string;
  assignedNumber: number;
  status: "active" | "eliminated" | "winner";
  place?: number | null;
  joinedByUserId: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RaffleStaffAccess {
  raffleId: string;
  userId: string;
  role: "owner" | "manager" | "moderator";
  canManageRaffle: boolean;
  canPickWinner: boolean;
  canEliminateParticipants: boolean;
}

export interface RaffleSummary {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  prizeName: string | null;
  raffleCode: string;
  status: "draft" | "scheduled" | "active" | "closed" | "cancelled";
  drawAt: string | null;
  timezoneName: string;
  allowPublicJoin: boolean;
  showLiveParticipants: boolean;
  showCountdown: boolean;
  maxParticipants: number | null;
  winnerParticipantId: string | null;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
}

export interface RaffleDetail extends RaffleSummary {
  participants: RaffleParticipant[];
  staffAccess: RaffleStaffAccess | null;
  isStaff: boolean;
}

export interface CreateRaffleInput {
  title: string;
  description?: string;
  prizeName?: string;
  drawAt?: string | null;
  maxParticipants?: number | null;
}

interface RawRaffle {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  prize_name: string | null;
  raffle_code: string;
  status: "draft" | "scheduled" | "active" | "closed" | "cancelled";
  draw_at: string | null;
  timezone_name: string;
  allow_public_join: boolean;
  show_live_participants: boolean;
  show_countdown: boolean;
  max_participants: number | null;
  winner_participant_id: string | null;
  created_at: string;
  updated_at: string;
}

interface RawParticipant {
  id: string;
  raffle_id: string;
  display_name: string;
  assigned_number: number;
  status: "active" | "eliminated" | "winner";
  joined_by_user_id: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

interface RawStaffAccess {
  raffle_id: string;
  user_id: string;
  role: "owner" | "manager" | "moderator";
  can_manage_raffle: boolean;
  can_pick_winner: boolean;
  can_eliminate_participants: boolean;
}

const getClient = () => {
  if (!supabase) {
    throw new Error("Supabase no esta configurado");
  }

  return supabase;
};

const mapParticipant = (participant: RawParticipant): RaffleParticipant => ({
  id: participant.id,
  raffleId: participant.raffle_id,
  displayName: participant.display_name,
  assignedNumber: participant.assigned_number,
  status: participant.status,
  place: (participant as any).place,
  joinedByUserId: participant.joined_by_user_id,
  joinedAt: participant.joined_at,
  createdAt: participant.created_at,
  updatedAt: participant.updated_at,
});

const mapRaffleSummary = (
  raffle: RawRaffle,
  participantCount = 0,
): RaffleSummary => ({
  id: raffle.id,
  ownerId: raffle.owner_id,
  title: raffle.title,
  description: raffle.description,
  prizeName: raffle.prize_name,
  raffleCode: raffle.raffle_code,
  status: raffle.status,
  drawAt: raffle.draw_at,
  timezoneName: raffle.timezone_name,
  allowPublicJoin: raffle.allow_public_join,
  showLiveParticipants: raffle.show_live_participants,
  showCountdown: raffle.show_countdown,
  maxParticipants: raffle.max_participants,
  winnerParticipantId: raffle.winner_participant_id,
  createdAt: raffle.created_at,
  updatedAt: raffle.updated_at,
  participantCount,
});

const mapStaffAccess = (staff: RawStaffAccess): RaffleStaffAccess => ({
  raffleId: staff.raffle_id,
  userId: staff.user_id,
  role: staff.role,
  canManageRaffle: staff.can_manage_raffle,
  canPickWinner: staff.can_pick_winner,
  canEliminateParticipants: staff.can_eliminate_participants,
});

const normalizeCode = (code: string) => code.trim().toUpperCase();

const getParticipantCount = async (raffleId: string) => {
  const client = getClient();
  const { count, error } = await client
    .from("raffle_participants")
    .select("*", { count: "exact", head: true })
    .eq("raffle_id", raffleId);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

export const getConcursantes = async (): Promise<Concursante[]> => {
  const client = getClient();
  const { data, error } = await client.from("concursantes").select("*");
  if (error) throw error;
  return data as Concursante[];
};

export const crearConcursante = async (nuevo: Omit<Concursante, "id">) => {
  const client = getClient();
  const { error } = await client.from("concursantes").insert([nuevo]);
  if (error) throw error;
};

export const getGanador = async (): Promise<Concursante | null> => {
  const client = getClient();
  const { data, error } = await client
    .from("concursantes")
    .select("*")
    .eq("es_ganador", true)
    .single();

  if (error || !data) return null;
  return data as Concursante;
};

export const marcarGanador = async (id: string | number) => {
  const client = getClient();
  await client.from("concursantes").update({ es_ganador: false }).eq("es_ganador", true);
  const { error } = await client.from("concursantes").update({ es_ganador: true }).eq("id", id);
  if (error) throw error;
};

export const login = async (email: string, password: string) => {
  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const register = async (email: string, password: string, nombre: string) => {
  const client = getClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: nombre,
        name: nombre,
      },
    },
  });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const client = getClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const client = getClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
};

export const getMyRaffles = async (): Promise<RaffleSummary[]> => {
  const client = getClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesion");
  }

  const { data, error } = await client
    .from("raffles")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const raffles = (data ?? []) as RawRaffle[];
  const withCounts = await Promise.all(
    raffles.map(async (raffle) => mapRaffleSummary(raffle, await getParticipantCount(raffle.id))),
  );

  return withCounts;
};

export const createRaffle = async (input: CreateRaffleInput): Promise<RaffleSummary> => {
  const client = getClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesion");
  }

  const payload = {
    owner_id: user.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    prize_name: input.prizeName?.trim() || null,
    raffle_code: "",
    draw_at: input.drawAt || null,
    status: input.drawAt ? "scheduled" : "active",
    max_participants: input.maxParticipants ?? null,
  };

  const { data, error } = await client
    .from("raffles")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapRaffleSummary(data as RawRaffle, 0);
};

export const getRaffleByCode = async (code: string): Promise<RaffleDetail | null> => {
  const client = getClient();
  const normalizedCode = normalizeCode(code);
  const { data, error } = await client
    .from("raffles")
    .select("*")
    .eq("raffle_code", normalizedCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const raffle = data as RawRaffle;
  const participants = await getRaffleParticipants(raffle.id);
  const staffAccess = await getRaffleStaffAccess(raffle.id);

  return {
    ...mapRaffleSummary(raffle, participants.length),
    participants,
    staffAccess,
    isStaff: Boolean(staffAccess),
  };
};

export const getRaffleParticipants = async (raffleId: string): Promise<RaffleParticipant[]> => {
  const client = getClient();
  const { data, error } = await client
    .from("raffle_participants")
    .select("*")
    .eq("raffle_id", raffleId)
    .order("assigned_number", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as RawParticipant[]).map(mapParticipant);
};

export const getRaffleStaffAccess = async (raffleId: string): Promise<RaffleStaffAccess | null> => {
  const client = getClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await client
    .from("raffle_staff")
    .select("*")
    .eq("raffle_id", raffleId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapStaffAccess(data as RawStaffAccess);
};

export const joinRaffle = async (
  raffleId: string,
  displayName: string,
  assignedNumber: number,
): Promise<RaffleParticipant> => {
  const client = getClient();
  const user = await getCurrentUser();

  const payload: any = {
    raffle_id: raffleId,
    display_name: displayName.trim(),
    assigned_number: assignedNumber,
    status: "active",
  };

  if (user) {
    payload.joined_by_user_id = user.id;
  }

  const { data, error } = await client
    .from("raffle_participants")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    throw new Error(`DB Error: ${error.message} ${error.details || ''}`);
  }

  try {
  await client.from("raffle_events").insert({
    raffle_id: raffleId,
    participant_id: (data as RawParticipant).id,
    actor_user_id: user?.id ?? null,
    event_type: "participant_joined",
    payload: {
      display_name: displayName.trim(),
      assigned_number: assignedNumber,
    },
  });
  } catch (eventError) {
    console.warn("No se pudo guardar el evento en la base de datos:", eventError);
  }

  return mapParticipant(data as RawParticipant);
};

export const selectWinnerForRaffle = async (raffleId: string, participantId: string, place: number) => {
  const client = getClient();
  const user = await getCurrentUser();

  const { error: winnerError } = await client
    .from("raffle_participants")
    .update({ status: "winner", place })
    .eq("raffle_id", raffleId)
    .eq("id", participantId);

  if (winnerError) {
    throw winnerError;
  }

  if (place === 1) {
    const { error: raffleError } = await client
      .from("raffles")
      .update({
        winner_participant_id: participantId,
        status: "closed",
      })
      .eq("id", raffleId);

    if (raffleError) {
      throw raffleError;
    }
  }

  await client.from("raffle_events").insert({
    raffle_id: raffleId,
    participant_id: participantId,
    actor_user_id: user?.id ?? null,
    event_type: "winner_selected",
    payload: { place },
  });
};

export const eliminateParticipantFromRaffle = async (raffleId: string, participantId: string) => {
  const client = getClient();
  const user = await getCurrentUser();

  const { error } = await client
    .from("raffle_participants")
    .update({ status: "eliminated" })
    .eq("raffle_id", raffleId)
    .eq("id", participantId);

  if (error) {
    throw error;
  }

  await client.from("raffle_events").insert({
    raffle_id: raffleId,
    participant_id: participantId,
    actor_user_id: user?.id ?? null,
    event_type: "participant_eliminated",
    payload: {},
  });
};

export const deleteRaffle = async (raffleId: string) => {
  const client = getClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesion");
  }

  const { error } = await client
    .from("raffles")
    .delete()
    .eq("id", raffleId)
    .eq("owner_id", user.id); // Validamos que solo el dueño lo pueda borrar

  if (error) {
    throw error;
  }
};
