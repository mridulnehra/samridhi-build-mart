import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Inject the slideIn animation into the document head once
const STYLE_ID = 'toast-animations';
function ensureAnimationStyle() {
    if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => { ensureAnimationStyle(); }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    pointerEvents: 'none',
                }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        style={{
                            background: 'white',
                            color: '#333',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            minWidth: '300px',
                            maxWidth: '400px',
                            pointerEvents: 'auto',
                            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            borderLeft: `4px solid ${toast.type === 'success' ? '#4CAF50' :
                                toast.type === 'error' ? '#F44336' : '#2196F3'
                                }`,
                        }}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} color="#4CAF50" />}
                        {toast.type === 'error' && <AlertCircle size={20} color="#F44336" />}
                        {toast.type === 'info' && <Info size={20} color="#2196F3" />}

                        <p style={{ margin: 0, fontSize: '14px', flex: 1, fontWeight: 500 }}>{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999',
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
