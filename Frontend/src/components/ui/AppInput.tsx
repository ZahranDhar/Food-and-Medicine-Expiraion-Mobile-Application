import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  containerStyle?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  isPassword = false,
  containerStyle = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(isPassword);

  return (
    <View className={`mb-4.5 w-full ${containerStyle}`}>
      {label && (
        <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
          {label}
        </Text>
      )}
      
      <View 
        className={`flex-row items-center border rounded-2xl bg-white dark:bg-slate-900 px-4 h-14
          ${error 
            ? 'border-red-500' 
            : isFocused 
              ? 'border-emerald-500' 
              : 'border-slate-200 dark:border-slate-850'
          }`}
      >
        <TextInput
          className="flex-1 text-slate-900 dark:text-white text-sm h-full py-0"
          placeholderTextColor="#94a3b8"
          secureTextEntry={isPassword ? hidePassword : false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          style={{ outlineWidth: 0 } as any}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity 
            onPress={() => setHidePassword(!hidePassword)}
            className="p-1 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {hidePassword ? 'SHOW' : 'HIDE'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="text-xs font-medium text-red-500 mt-1 ml-1.5">
          {error}
        </Text>
      )}
    </View>
  );
};

export default AppInput;
