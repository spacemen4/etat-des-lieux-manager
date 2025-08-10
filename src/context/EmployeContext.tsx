import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/etatDesLieux';
import { useUser } from './UserContext';
import { useAuth } from '@/auth';

export type Employe = Tables<'employes'>;

export type EmployeContextValue = {
  loading: boolean;
  error: string | null;
  employes: Employe[];
  refreshEmployes: () => Promise<void>;
  addEmploye: (payload: Omit<TablesInsert<'employes'>, 'user_id'> & Partial<Pick<TablesInsert<'employes'>, 'user_id'>>) => Promise<Employe>;
  updateEmploye: (id: string, updates: TablesUpdate<'employes'>) => Promise<Employe>;
  removeEmploye: (id: string) => Promise<void>;
};

const EmployeContext = createContext<EmployeContextValue | null>(null);

export const EmployeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userUuid, loading: loadingUserId } = useUser();
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [employes, setEmployes] = useState<Employe[]>([]);

  const ensureUtilisateurRow = useCallback(async () => {
    if (!authUser?.id) return false;
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (error) {
        if ((error as any).code === 'PGRST116') {
          const prenom = authUser.user_metadata?.prenom || authUser.user_metadata?.first_name || 'Utilisateur';
          const nom = authUser.user_metadata?.nom || authUser.user_metadata?.last_name || 'Courant';
          const email = authUser.email || `${authUser.id}@local`;
          console.log('[EmployeContext] ensureUtilisateurRow: inserting utilisateurs row', { id: authUser.id, email, prenom, nom });
          const { error: insertError } = await supabase
            .from('utilisateurs')
            .insert({ id: authUser.id, email, prenom, nom });
          if (insertError) throw insertError;
          console.log('[EmployeContext] ensureUtilisateurRow: created utilisateurs row');
          return true;
        }
        throw error;
      }
      console.log('[EmployeContext] ensureUtilisateurRow: utilisateurs row exists?', { exists: !!data });
      return !!data;
    } catch (e: any) {
      setError(e.message ?? "Impossible d'initialiser l'utilisateur");
      console.error('[EmployeContext] ensureUtilisateurRow: error', e);
      return false;
    }
  }, [authUser]);

  const refreshEmployes = useCallback(async () => {
    if (!userUuid) return;
    setLoading(true);
    setError(null);
    try {
      await ensureUtilisateurRow();
      const { data, error } = await supabase
        .from('employes')
        .select('*')
        .eq('user_id', userUuid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEmployes(data ?? []);
      console.log('[EmployeContext] refreshEmployes: loaded', { count: data?.length ?? 0 });
    } catch (e: any) {
      setError(e.message ?? 'Erreur lors du chargement des employés');
      console.error('[EmployeContext] refreshEmployes: error', e);
    } finally {
      setLoading(false);
    }
  }, [userUuid, ensureUtilisateurRow]);

  useEffect(() => {
    if (!loadingUserId && userUuid) {
      refreshEmployes();
    }
  }, [loadingUserId, userUuid, refreshEmployes]);

  const addEmploye: EmployeContextValue['addEmploye'] = useCallback(async (payload) => {
    if (!userUuid) throw new Error('Utilisateur non authentifié');
    setError(null);
    setLoading(true);
    try {
      await ensureUtilisateurRow();
      const newEmploye: TablesInsert<'employes'> = {
        prenom: payload.prenom?.trim() ?? '',
        nom: payload.nom?.trim() ?? '',
        email: payload.email?.trim() || null,
        telephone: payload.telephone?.trim() || null,
        fonction: payload.fonction?.trim() || null,
        actif: payload.actif ?? true,
        user_id: payload.user_id ?? userUuid,
      };
      console.log('[EmployeContext] addEmploye: inserting', newEmploye);
      const { data, error } = await supabase
        .from('employes')
        .insert(newEmploye)
        .select()
        .single();
      if (error) throw error;
      const created = data as Employe;
      setEmployes((prev) => [created, ...prev]);
      console.log('[EmployeContext] addEmploye: success', { created });
      return created;
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de l'ajout de l'employé");
      console.error('[EmployeContext] addEmploye: error', e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [userUuid, ensureUtilisateurRow]);

  const updateEmploye: EmployeContextValue['updateEmploye'] = useCallback(async (id, updates) => {
    if (!id) throw new Error('Identifiant manquant');
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const updated = data as Employe;
      setEmployes((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la mise à jour de l'employé");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeEmploye: EmployeContextValue['removeEmploye'] = useCallback(async (id) => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEmployes((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la suppression de l'employé");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<EmployeContextValue>(() => ({
    loading,
    error,
    employes,
    refreshEmployes,
    addEmploye,
    updateEmploye,
    removeEmploye,
  }), [loading, error, employes, refreshEmployes, addEmploye, updateEmploye, removeEmploye]);

  return (
    <EmployeContext.Provider value={value}>
      {children}
    </EmployeContext.Provider>
  );
};

export const useEmployes = (): EmployeContextValue => {
  const ctx = useContext(EmployeContext);
  if (!ctx) {
    throw new Error('useEmployes must be used within an EmployeProvider');
  }
  return ctx;
};
