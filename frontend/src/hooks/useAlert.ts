import { useState } from 'react';

interface AlertState {
  severity: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

const useAlert = () => {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlert = (severity: AlertState['severity'], message: string) => {
    setAlert({ severity, message });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  return { alert, showAlert, hideAlert };
};

export default useAlert;
