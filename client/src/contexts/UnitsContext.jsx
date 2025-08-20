import {createContext, useContext, useState, useEffect, useMemo} from "react";

const UnitsContext = createContext();
const STORAGE_KEY = 'units';

export const UnitsContextProvider = ({ children }) => {
    const [units, setUnits] = useState(() => {
        const s = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        return s === 'imp' || s === 'met' ? s : 'met';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, units);
    }, [units]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key !== STORAGE_KEY) return;
            if (e.newValue === 'imp' || e.newValue === 'met'){
                setUnits(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const value = useMemo(
        () => ({
            units: units,
            setUnits: setUnits,
            toggleUnits: () => setUnits((u) => (u === 'imp' ? 'met' : 'imp'))
        }),
        [units]
    );

    return (
        <UnitsContext.Provider value={value}>
            {children}
        </UnitsContext.Provider>);
}

export function useUnits() {
    const ctx = useContext(UnitsContext);
    if (!ctx) throw new Error('"useUnits must be used within <UnitsContextProvider>');
    return ctx;
}