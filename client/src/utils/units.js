// src/utils/units.js
export const KM_PER_MI = 1.60934;
export const M_PER_FT = 0.3048;

export const isImp = (u) => u === "imp";

export const kmToUi = (km, u) => (isImp(u) ? km / KM_PER_MI : km);
export const uiToKm = (v, u) => (isImp(u) ? v * KM_PER_MI : v);
export const mToUi = (m, u) => (isImp(u) ? m / M_PER_FT : m);

export const distLabel = (u) => (isImp(u) ? "mi" : "km");
export const elevLabel = (u) => (isImp(u) ? "ft" : "m");
