import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [userUuid, setUserUuid] = useState(null);

    useEffect(() => {
        if (user && user.id) {
            setUserUuid(user.id);
            setLoading(false);
        } else {
            setUserUuid(null);
            setLoading(false);
        }
    }, [user]);

    const value = {
        loading,
        userUuid,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    return useContext(UserContext);
};
