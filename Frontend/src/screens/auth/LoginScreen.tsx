import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setApiError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Enter a valid email address');
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setApiError(err.message || 'Incorrect email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} className="px-6 justify-center bg-slate-50 dark:bg-slate-950 py-10">
      <View className="items-center mb-8">
        <Text className="text-6xl mb-3">🍏</Text>
        <Text className="text-3xl font-black text-slate-900 dark:text-white mb-2">
          Welcome Back
        </Text>
        <Text className="text-sm text-slate-400 dark:text-slate-400 text-center max-w-[280px]">
          Sign in to track your food freshness and reduce kitchen waste.
        </Text>
      </View>

      <View className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-850 shadow-sm mb-6">
        {apiError ? (
          <View className="bg-red-50 dark:bg-red-950/20 border border-red-250 dark:border-red-900/30 p-3.5 rounded-2xl mb-4">
            <Text className="text-xs font-semibold text-red-650 dark:text-red-400 text-center">
              {apiError}
            </Text>
          </View>
        ) : null}

        <AppInput
          label="EMAIL ADDRESS"
          placeholder="e.g. john@example.com"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          keyboardType="email-address"
          autoComplete="email"
        />

        <AppInput
          label="PASSWORD"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          isPassword={true}
          autoComplete="password"
        />

        <AppButton
          title="Sign In"
          onPress={handleLogin}
          isLoading={isLoading}
          className="mt-2"
        />
      </View>

      <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
        <Text className="text-sm text-slate-400 dark:text-slate-400">{"Don't have an account? "}</Text><Text
          className="text-sm font-bold text-emerald-500"
          onPress={() => navigation.navigate('Signup')}
        >{'Sign Up'}</Text>
      </View>
    </ScreenContainer>
  );
};

export default LoginScreen;
