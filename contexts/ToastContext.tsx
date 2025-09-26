import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View } from 'react-native';
import { Toast, ToastProps, ToastType } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onDismiss'>) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  success: (title: string, message?: string, options?: Partial<ToastProps>) => string;
  error: (title: string, message?: string, options?: Partial<ToastProps>) => string;
  warning: (title: string, message?: string, options?: Partial<ToastProps>) => string;
  info: (title: string, message?: string, options?: Partial<ToastProps>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 3,
}) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showToast = (toast: Omit<ToastProps, 'id' | 'onDismiss'>): string => {
    const id = generateId();
    const newToast: ToastProps & { id: string } = {
      ...toast,
      id,
      onDismiss: hideToast,
    };

    setToasts(prevToasts => {
      const updatedToasts = [newToast, ...prevToasts];
      // Limit the number of toasts
      return updatedToasts.slice(0, maxToasts);
    });

    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const hideAllToasts = () => {
    setToasts([]);
  };

  const success = (
    title: string,
    message?: string,
    options?: Partial<ToastProps>
  ): string => {
    return showToast({
      type: 'success',
      title,
      message,
      ...options,
    });
  };

  const error = (
    title: string,
    message?: string,
    options?: Partial<ToastProps>
  ): string => {
    return showToast({
      type: 'error',
      title,
      message,
      duration: 6000, // Errors stay longer
      ...options,
    });
  };

  const warning = (
    title: string,
    message?: string,
    options?: Partial<ToastProps>
  ): string => {
    return showToast({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options,
    });
  };

  const info = (
    title: string,
    message?: string,
    options?: Partial<ToastProps>
  ): string => {
    return showToast({
      type: 'info',
      title,
      message,
      ...options,
    });
  };

  const value: ToastContextType = {
    showToast,
    hideToast,
    hideAllToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Render toasts */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            {...toast}
            style={{
              // Offset multiple toasts
              transform: [{ translateY: index * 10 }],
              zIndex: 1000 - index,
            }}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};