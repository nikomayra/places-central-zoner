import { useContext } from 'react';
import AuthContext from '../Contexts/authContext';
import { AuthContextType } from '../interfaces/interfaces';

const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};

export default useAuth;
