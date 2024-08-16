import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import useAuth from '../hooks/useAuth';
import { Modal } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';

const SessionExpiryModal: React.FC = () => {
  const { isAuthenticated, login, tokenExp } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const idToken = sessionStorage.getItem('id_token');
    if (!idToken || !tokenExp) return;

    const expTime = dayjs.unix(tokenExp); // Convert Unix timestamp to dayjs object

    const refreshInterval = setInterval(async () => {
      const now = dayjs();
      // Check if the token is about to expire (e.g., 5 minutes before)
      if (now.isAfter(expTime.subtract(5, 'minute'))) {
        try {
          console.warn('Session is about to expire...');
          setOpen(true);
        } catch (error) {
          console.error('Session extension failed', error);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, login, tokenExp]);

  const handleClose = () => setOpen(false);

  return (
    <Modal open={open} onClose={handleClose}>
      <div
        style={{ padding: '20px', backgroundColor: 'white', margin: 'auto' }}
      >
        <h2>Session Expiring Soon</h2>
        <p>Your session will expire soon. Please log in again to continue.</p>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            console.log('credentialResponse: ', credentialResponse);
            if (credentialResponse.credential) {
              login(credentialResponse.credential);
              handleClose();
            } else {
              console.error('ID_TOKEN returned undefined...');
            }
          }}
          onError={() => {
            console.log('Login Failed');
          }}
          theme={'filled_blue'}
          size={'large'}
          text={'signin_with'}
          width={'300'}
        />
      </div>
    </Modal>
  );
};

export default SessionExpiryModal;
