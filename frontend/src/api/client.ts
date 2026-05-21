import createClient from 'openapi-fetch';
import type { paths } from './schema.d.ts';

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
});

// const { data, error } = await api.GET('/reservations');
// if (error) { /* error.code === 'UNAUTHORIZED' ... */ return; }
// console.log(data); // Reservation[]
