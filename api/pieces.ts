import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialiser le client Supabase
// Assurez-vous que les variables d'environnement sont configurées dans Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'POST') {
    try {
      const { etat_des_lieux_id, nom_piece } = request.body;

      if (!etat_des_lieux_id || !nom_piece) {
        return response.status(400).json({ error: 'etat_des_lieux_id and nom_piece are required' });
      }

      // Ici, nous supposons que l'utilisateur est authentifié si nécessaire,
      // ou que la table `pieces` permet des écritures anonymes sécurisées par des RLS policies.
      // Pour une vraie application, vous ajouteriez une vérification d'authentification ici.
      // Exemple: const { data: { user } } = await supabase.auth.getUser(request.headers.authorization?.split(' ')[1]);
      // if (!user) return response.status(401).json({ error: 'Unauthorized' });

      const { data, error } = await supabase
        .from('pieces')
        .insert([{ etat_des_lieux_id, nom_piece }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return response.status(500).json({ error: error.message });
      }

      return response.status(201).json(data);
    } catch (e: any) {
      console.error('Handler error:', e);
      return response.status(500).json({ error: e.message || 'Something went wrong' });
    }
  } else {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }
}
