import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const { user } = useAuth();
    const [etatsDesLieux, setEtatsDesLieux] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEtatsDesLieux = async () => {
            if (user) {
                setLoading(true);
                const { data, error } = await supabase
                    .from('etats_des_lieux')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error fetching etats des lieux:', error);
                } else {
                    setEtatsDesLieux(data);
                }
                setLoading(false);
            }
        };

        fetchEtatsDesLieux();
    }, [user]);

    const value = {
        etatsDesLieux,
        loading,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    return useContext(UserContext);
};
