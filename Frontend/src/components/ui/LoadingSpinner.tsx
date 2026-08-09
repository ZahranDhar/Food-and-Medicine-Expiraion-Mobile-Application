import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  color = '#10b981', // Emerald 500 default
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="mt-4 text-base font-medium text-slate-500 dark:text-slate-400 text-center">
          {message}
        </Text>
      )}
    </View>
  );
};

export default LoadingSpinner;
