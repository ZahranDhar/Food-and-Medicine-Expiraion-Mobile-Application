import React from 'react';
import { View, Text } from 'react-native';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  firstName = '',
  lastName = '',
  size = 'medium',
  className = '',
}) => {
  const getInitials = () => {
    const f = firstName.trim().charAt(0).toUpperCase();
    const l = lastName.trim().charAt(0).toUpperCase();
    return `${f}${l}` || '?';
  };

  const getDimensionStyles = () => {
    switch (size) {
      case 'small':
        return { container: 'w-10 h-10 rounded-full', text: 'text-xs font-semibold' };
      case 'medium':
        return { container: 'w-16 h-16 rounded-full', text: 'text-lg font-bold' };
      case 'large':
        return { container: 'w-24 h-24 rounded-[32px]', text: 'text-2xl font-bold' };
      case 'xlarge':
        return { container: 'w-32 h-32 rounded-[40px]', text: 'text-4xl font-bold' };
    }
  };

  const dims = getDimensionStyles();

  return (
    <View 
      className={`items-center justify-center bg-emerald-100 dark:bg-emerald-950/50 border-2 border-emerald-500/10 ${dims.container} ${className}`}
    >
      <Text className={`text-emerald-700 dark:text-emerald-450 ${dims.text}`}>
        {getInitials()}
      </Text>
    </View>
  );
};

export default Avatar;
