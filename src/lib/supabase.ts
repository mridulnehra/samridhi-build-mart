import { createClient } from '@supabase/supabase-js';

// Use proxy URL in production, or direct Supabase URL in development
const isDev = import.meta.env.DEV;
const origin = typeof window !== 'undefined' ? window.location.origin : '';
const supabaseUrl = isDev ? (import.meta.env.VITE_SUPABASE_URL || '') : `${origin}/api/supabase`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Warn at startup if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase configuration is missing!\n' +
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Returns true if Supabase env vars are configured */
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
}

/** Wraps a promise with a timeout. Rejects if the promise doesn't resolve within `ms` milliseconds. */
export function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number = 10000): Promise<T> {
    const promise = Promise.resolve(promiseLike);
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
        ),
    ]);
}
