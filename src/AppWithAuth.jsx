import React from 'react';
import { useAuth } from './AuthContext';
import Login from './Login';
import App from './App';

const AppWithAuth = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return <App />;
};

export default AppWithAuth;