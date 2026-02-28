

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './index';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning';
    isLoading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning',
    isLoading = false,
}: ConfirmDialogProps) {
    const isDanger = type === 'danger';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                        style={{
                            backgroundColor: isDanger ? '#dc2626' : undefined,
                            color: isDanger ? 'white' : undefined,
                            border: isDanger ? 'none' : undefined,
                        }}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
                <div
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: isDanger ? '#fee2e2' : '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <AlertTriangle
                        size={24}
                        color={isDanger ? '#dc2626' : '#d97706'}
                    />
                </div>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                        {title}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
}
