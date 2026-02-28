import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Warn at startup if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase environment variables are missing!\n' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.\n' +
        'For Vercel: Go to Project Settings → Environment Variables.'
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
