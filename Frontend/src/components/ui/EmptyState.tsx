import React from 'react';
import { View, Text } from 'react-native';
import AppButton from './AppButton';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
      <Text className="text-6xl mb-6">📦</Text>
      <Text className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">
        {title}
      </Text>
      <Text className="text-sm text-slate-400 dark:text-slate-400 text-center mb-6 max-w-xs leading-relaxed">
        {description}
      </Text>
      {actionLabel && onAction && (
        <AppButton 
          title={actionLabel} 
          onPress={onAction} 
          size="medium" 
          variant="primary" 
        />
      )}
    </View>
  );
};

export default EmptyState;
