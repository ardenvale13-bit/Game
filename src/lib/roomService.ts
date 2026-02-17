import { supabase } from './supabase';

export interface Room {
  id: string;
  code: string;
  name: string | null;
  host_player_id: string;
  selected_game: string | null;
  status: string;
  created_at: string;
}

export async function createRoom(code: string, name: string | null, hostPlayerId: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      code,
      name,
      host_player_id: hostPlayerId,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create room:', error);
    return null;
  }

  return data;
}

export async function findRoom(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error) {
    console.error('Room lookup failed:', error);
    return null;
  }

  return data;
}

export async function updateRoom(code: string, updates: Partial<Pick<Room, 'selected_game' | 'status' | 'name'>>): Promise<boolean> {
  const { error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('code', code);

  if (error) {
    console.error('Failed to update room:', error);
    return false;
  }

  return true;
}

export async function deleteRoom(code: string): Promise<boolean> {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('code', code);

  if (error) {
    console.error('Failed to delete room:', error);
    return false;
  }

  return true;
}
