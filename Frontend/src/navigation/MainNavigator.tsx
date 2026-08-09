import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export const MainNavigator = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Checking session..." />;
  }

  return (
    <NavigationContainer>
      {user && token ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default MainNavigator;
