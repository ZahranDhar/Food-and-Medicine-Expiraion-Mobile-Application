import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { signup } = useAuth();

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    setApiError('');

    if (!username.trim()) newErrors.username = 'Username is required';
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');
    try {
      await signup(
        username.trim(),
        firstName.trim(),
        lastName.trim(),
        email.trim(),
        password
      );
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Try a different username or email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} className="px-6 justify-center bg-slate-50 dark:bg-slate-950 py-10">
      <View className="items-center mb-6">
        <Text className="text-6xl mb-3">🥗</Text>
        <Text className="text-3xl font-black text-slate-900 dark:text-white mb-2">
          Create Account
        </Text>
        <Text className="text-sm text-slate-400 dark:text-slate-400 text-center max-w-[280px]">
          Join us today to keep your kitchen fresh and waste-free.
        </Text>
      </View>

      <View className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-850 shadow-sm mb-6">
        {apiError ? (
          <View className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3.5 rounded-2xl mb-4">
            <Text className="text-xs font-semibold text-red-600 dark:text-red-400 text-center">
              {apiError}
            </Text>
          </View>
        ) : null}

        <AppInput
          label="USERNAME"
          placeholder="e.g. johndoe"
          value={username}
          onChangeText={setUsername}
          error={errors.username}
        />

        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <AppInput
            label="FIRST NAME"
            placeholder="e.g. John"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            containerStyle="flex-1 mb-4.5"
          />
          <AppInput
            label="LAST NAME"
            placeholder="e.g. Doe"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            containerStyle="flex-1 mb-4.5"
          />
        </View>

        <AppInput
          label="EMAIL ADDRESS"
          placeholder="e.g. john@example.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
        />

        <AppInput
          label="PASSWORD"
          placeholder="Min. 6 characters"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          isPassword={true}
        />

        <AppInput
          label="CONFIRM PASSWORD"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          isPassword={true}
        />

        <AppButton
          title="Sign Up"
          onPress={handleSignup}
          isLoading={isLoading}
          className="mt-2"
        />
      </View>

      <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
        <Text className="text-sm text-slate-400 dark:text-slate-400">{'Already have an account? '}</Text><Text
          className="text-sm font-bold text-emerald-500"
          onPress={() => navigation.navigate('Login')}
        >{'Sign In'}</Text>
      </View>
    </ScreenContainer>
  );
};

export default SignupScreen;
