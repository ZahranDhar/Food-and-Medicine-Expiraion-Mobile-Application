import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ProductProvider } from './src/context/ProductContext';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProductProvider>
          <MainNavigator />
        </ProductProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
