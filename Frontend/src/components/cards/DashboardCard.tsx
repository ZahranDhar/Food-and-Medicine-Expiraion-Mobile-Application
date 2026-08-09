import React from 'react';
import { View, Text } from 'react-native';

interface DashboardCardProps {
  value: number;
  label: string;
  type: 'total' | 'active' | 'expiring' | 'expired';
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  value,
  label,
  type,
}) => {
  const getThemeStyles = () => {
    switch (type) {
      case 'total':
        return {
          bg: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800',
          textVal: 'text-slate-800 dark:text-slate-100',
          textLab: 'text-slate-500 dark:text-slate-400',
          badgeBg: 'bg-slate-100 dark:bg-slate-800',
          icon: '📦',
        };
      case 'active':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30',
          textVal: 'text-emerald-700 dark:text-emerald-400',
          textLab: 'text-emerald-600 dark:text-emerald-500',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
          icon: '✅',
        };
      case 'expiring':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30',
          textVal: 'text-orange-700 dark:text-orange-400',
          textLab: 'text-orange-600 dark:text-orange-500',
          badgeBg: 'bg-orange-100 dark:bg-orange-900/40',
          icon: '🍊',
        };
      case 'expired':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30',
          textVal: 'text-red-700 dark:text-red-450',
          textLab: 'text-red-600 dark:text-red-500',
          badgeBg: 'bg-red-100 dark:bg-red-900/40',
          icon: '⚠️',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <View 
      className={`w-[47%] p-4 mb-4 border rounded-3xl shadow-sm ${styles.bg} justify-between min-h-[110px]`}
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className={`p-1.5 rounded-xl ${styles.badgeBg}`}>
          <Text className="text-base">{styles.icon}</Text>
        </View>
      </View>
      
      <View>
        <Text className={`text-2xl font-black ${styles.textVal}`}>
          {value}
        </Text>
        <Text className={`text-xs font-semibold ${styles.textLab}`}>
          {label}
        </Text>
      </View>
    </View>
  );
};

export default DashboardCard;
