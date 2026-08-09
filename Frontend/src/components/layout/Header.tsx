import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightElement,
}) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View className="h-16 flex-row items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <View className="flex-row items-center flex-1">
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            className="mr-3 p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
            activeOpacity={0.7}
          >
            {/* Render a custom back arrow character */}
            <Text className="text-xl text-slate-800 dark:text-slate-200 font-semibold">←</Text>
          </TouchableOpacity>
        )}
        <Text 
          className="text-xl font-bold text-slate-900 dark:text-white leading-none truncate"
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {rightElement && (
        <View className="flex-row items-center">
          {rightElement}
        </View>
      )}
    </View>
  );
};

export default Header;
