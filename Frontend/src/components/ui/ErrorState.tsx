import React from 'react';
import { View, Text } from 'react-native';
import AppButton from './AppButton';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
      <Text className="text-6xl mb-6">⚠️</Text>
      <Text className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">
        Something Went Wrong
      </Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-xs leading-relaxed">
        {message}
      </Text>
      {onRetry && (
        <AppButton 
          title="Try Again" 
          onPress={onRetry} 
          size="medium" 
          variant="outline" 
        />
      )}
    </View>
  );
};

export default ErrorState;
