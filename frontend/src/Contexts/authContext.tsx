import React, { createContext, useState, useEffect } from 'react';
import { AuthContextType } from '../interfaces/interfaces';
import storage from '../utils/storageUtil';
import axiosService from '../services/axiosService';
import axios from 'axios';

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  userName: null,
  tokenExp: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(null);
  const [tokenExp, setTokenExp] = useState(null);

  const login = (token: string) => {
    storage.setSessionItem('id_token', token);
    //console.log('SET TOKEN');
    setIsAuthenticated(true);
  };

  const logout = () => {
    storage.removeSessionItem('id_token');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const checkToken = async () => {
      const idToken = storage.getSessionItem('id_token');
      //console.log('GET TOKEN');
      if (idToken) {
        try {
          const res = await axiosService.authUser(idToken);
          console.log('Authentication res data/status:', res.data, res.status);
          setUserName(res.data['user']['name']);
          setTokenExp(res.data['user']['exp']);
          if (res.status === 200) {
            console.log('Token validated successfully.');
            setIsAuthenticated(true);
          } else {
            console.log('Token validation failed.');
            setIsAuthenticated(false);
          }
        } catch (err) {
          if (axios.isAxiosError(err)) console.error(err.response?.data?.error);
          setIsAuthenticated(false);
        }
      } else {
        console.error('Failed to find session token');
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, loading, userName, tokenExp }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
