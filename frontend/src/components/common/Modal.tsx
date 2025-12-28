import React, { useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}



// Visual styles for the dialog box itself
const dialogStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '0', // Padding handled by inner container
    minWidth: '320px',
    maxWidth: '500px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
    color: 'var(--text-primary)',
};

// Internal layout (Flex)
const dialogInnerStyle: React.CSSProperties = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
};

const modalHeaderStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            dialog.showModal();
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        } else {
            dialog.close();
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            if (dialog?.open) dialog.close();
        };
    }, [isOpen]);

    // Handle Closing via Backdrop click or Escape
    const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
        e.preventDefault();
        onClose();
    };

    const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        const dialog = dialogRef.current;
        if (dialog) {
            const rect = dialog.getBoundingClientRect();
            // Check if click is outside the dialog (on the backdrop)
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX && e.clientX <= rect.left + rect.width);

            if (!isInDialog) {
                onClose();
            }
        }
    };

    return (
        <dialog
            ref={dialogRef}
            onCancel={handleCancel}
            onClick={handleClick}
            style={{
                ...dialogStyle,
                margin: 'auto', // Center natively
                position: 'fixed', // Ensure fixed positioning even for dialog
                zIndex: 1000
                // NOTE: We do NOT set display: flex here to avoid overriding 'display: none' when closed.
            }}
            aria-labelledby="modal-title"
        >
            <div style={dialogInnerStyle}>
                <div id="modal-title" style={modalHeaderStyle}>{title}</div>
                {children}
            </div>
        </dialog>
    );
};

export default Modal;
