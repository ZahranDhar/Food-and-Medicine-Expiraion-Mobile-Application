import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  const getButtonStyles = () => {
    let base = 'flex-row items-center justify-center rounded-2xl ';
    
    // Size
    if (size === 'small') base += 'py-2.5 px-4 ';
    else if (size === 'medium') base += 'py-3.5 px-6 ';
    else if (size === 'large') base += 'py-4 px-8 ';

    // Variant
    if (disabled || isLoading) {
      base += 'bg-slate-200 dark:bg-slate-800 ';
    } else {
      switch (variant) {
        case 'primary':
          base += 'bg-emerald-500 active:bg-emerald-600 ';
          break;
        case 'secondary':
          base += 'bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700 ';
          break;
        case 'danger':
          base += 'bg-red-500 active:bg-red-600 ';
          break;
        case 'outline':
          base += 'bg-transparent border border-slate-300 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-900 ';
          break;
      }
    }
    return base + className;
  };

  const getTextStyles = () => {
    let base = 'font-bold text-center ';
    if (size === 'small') base += 'text-xs ';
    else if (size === 'medium') base += 'text-sm ';
    else if (size === 'large') base += 'text-base ';

    if (disabled || isLoading) {
      base += 'text-slate-400 dark:text-slate-650 ';
    } else {
      switch (variant) {
        case 'primary':
        case 'danger':
          base += 'text-white ';
          break;
        case 'secondary':
          base += 'text-slate-800 dark:text-slate-200 ';
          break;
        case 'outline':
          base += 'text-slate-700 dark:text-slate-300 ';
          break;
      }
    }
    return base;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={getButtonStyles()}
      activeOpacity={0.75}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'danger' ? '#ffffff' : '#10b981'} 
        />
      ) : (
        <Text className={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default AppButton;
