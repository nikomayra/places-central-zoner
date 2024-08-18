import React, { createContext, useState, useEffect } from 'react';
import { AuthContextType } from '../interfaces/interfaces';
import axiosService from '../services/axiosService';
import axios from 'axios';
import { CircularProgress } from '@mui/material';

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [tokenExp, setTokenExp] = useState<number | null>(null);

  const login = async (token: string) => {
    sessionStorage.setItem('token', token);
    setLoading(true);
    try {
      const { username, token_exp } = await axiosService.login(token);
      setUserName(username);
      setTokenExp(parseInt(token_exp));
      sessionStorage.setItem('userName', username);
      sessionStorage.setItem('tokenExp', token_exp);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Failed to login (api)');
      setIsAuthenticated(false);
      setLoading(false);
    }
    console.log('Logged in [authContext]');

    setLoading(false);
  };

  const logout = async (token: string) => {
    await axiosService.logout(token);
    sessionStorage.removeItem('token');
    setIsAuthenticated(false);
    console.log('Logged out [authContext]');
  };

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    console.log('authContext > checkToken');
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('Failed to find session token');
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const res = await axiosService.authSession(token);
      if (res.authenticated) {
        console.log('Session validated successfully.');
        const storedUserName = sessionStorage.getItem('userName');
        const storedTokenExp = sessionStorage.getItem('tokenExp');
        setUserName(storedUserName);
        if (storedTokenExp) {
          setTokenExp(parseInt(storedTokenExp));
        } else {
          console.error(
            'No token expiration found in storage when redefining useStates!'
          );
        }
        setIsAuthenticated(true);
      } else {
        console.log('Token validation failed.');
        setIsAuthenticated(false);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        err.response?.data?.error
          ? console.error(err.response?.data?.error)
          : console.error('Failed to authenticate by server');
      }
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, loading, userName, tokenExp }}
    >
      {loading && <AuthLoading />}
      {!loading && children}
    </AuthContext.Provider>
  );
};

const AuthLoading: React.FC = () => {
  console.log('App > Loading...');
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100px',
      }}
    >
      <CircularProgress />
    </div>
  );
};

export default AuthContext;
