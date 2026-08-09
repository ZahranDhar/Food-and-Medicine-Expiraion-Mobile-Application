import React from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProducts } from '../../context/ProductContext';
import { AppStackParamList } from '../../navigation/types';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Header from '../../components/layout/Header';

type DashboardScreenProps = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  sublabel: string;
  bg: string;
  valueCls: string;
  labelCls: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, sublabel, bg, valueCls, labelCls }) => (
  <View className={`w-[47%] p-5 mb-4 rounded-[28px] border ${bg} justify-between min-h-[130px]`}>
    <View className="w-10 h-10 rounded-2xl items-center justify-center bg-white/60">
      <Text className="text-xl">{icon}</Text>
    </View>
    <View className="mt-4">
      <Text className={`text-3xl font-black ${valueCls}`}>{value}</Text>
      <Text className={`text-sm font-bold ${valueCls} opacity-90`}>{label}</Text>
      <Text className={`text-xs font-medium ${labelCls} mt-0.5`}>{sublabel}</Text>
    </View>
  </View>
);

export const DashboardScreen: React.FC<DashboardScreenProps> = () => {
  const { statistics } = useProducts();

  // Accurate percentage widths for the health bar
  const total = statistics.total || 1; // avoid divide-by-zero
  const activePct = (statistics.active / total) * 100;
  const expiringPct = (statistics.expiring / total) * 100;
  const expiredPct = (statistics.expired / total) * 100;

  return (
    <ScreenContainer safeArea={true} scrollable={true}>
      <Header title="Dashboard" showBack={true} />

      <View className="p-5 bg-slate-50 dark:bg-slate-950 flex-1 pb-10">

        {/* Stats Header */}
        <Text className="text-xs font-black text-slate-400 dark:text-slate-500 mb-3 ml-1">
          PANTRY STATISTICS
        </Text>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-2">
          <StatCard
            icon="📦"
            value={statistics.total}
            label="Total Items"
            sublabel="In your pantry"
            bg="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
            valueCls="text-slate-800 dark:text-white"
            labelCls="text-slate-400 dark:text-slate-500"
          />
          <StatCard
            icon="✅"
            value={statistics.active}
            label="Active"
            sublabel="Fresh & good to use"
            bg="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40"
            valueCls="text-emerald-700 dark:text-emerald-400"
            labelCls="text-emerald-500 dark:text-emerald-600"
          />
          <StatCard
            icon="🍊"
            value={statistics.expiring}
            label="Expiring Soon"
            sublabel="Within 7 days"
            bg="bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40"
            valueCls="text-orange-700 dark:text-orange-400"
            labelCls="text-orange-500 dark:text-orange-600"
          />
          <StatCard
            icon="⚠️"
            value={statistics.expired}
            label="Expired"
            sublabel="Needs removal"
            bg="bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/40"
            valueCls="text-red-700 dark:text-red-400"
            labelCls="text-red-500 dark:text-red-600"
          />
        </View>

        {/* Pantry Health Bar */}
        <View className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 mb-6">
          <Text className="text-xs font-black text-slate-400 dark:text-slate-500 mb-1">
            PANTRY HEALTH
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Based on {statistics.total} item{statistics.total !== 1 ? 's' : ''}
          </Text>

          {/* Segmented bar with accurate % widths */}
          <View
            style={{ height: 14, borderRadius: 99, overflow: 'hidden', backgroundColor: '#f1f5f9', flexDirection: 'row' }}
          >
            {statistics.active > 0 && (
              <View style={{ width: `${activePct}%`, backgroundColor: '#10b981' }} />
            )}
            {statistics.expiring > 0 && (
              <View style={{ width: `${expiringPct}%`, backgroundColor: '#fb923c' }} />
            )}
            {statistics.expired > 0 && (
              <View style={{ width: `${expiredPct}%`, backgroundColor: '#f87171' }} />
            )}
          </View>

          {/* Legend with actual % labels */}
          <View className="flex-row justify-between mt-4">
            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', marginRight: 5 }} />
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active</Text>
              </View>
              <Text className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {activePct.toFixed(0)}%
              </Text>
              <Text className="text-xs text-slate-400">{statistics.active} items</Text>
            </View>
            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fb923c', marginRight: 5 }} />
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expiring</Text>
              </View>
              <Text className="text-sm font-black text-orange-500 dark:text-orange-400">
                {expiringPct.toFixed(0)}%
              </Text>
              <Text className="text-xs text-slate-400">{statistics.expiring} items</Text>
            </View>
            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#f87171', marginRight: 5 }} />
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expired</Text>
              </View>
              <Text className="text-sm font-black text-red-500 dark:text-red-400">
                {expiredPct.toFixed(0)}%
              </Text>
              <Text className="text-xs text-slate-400">{statistics.expired} items</Text>
            </View>
          </View>
        </View>

      </View>
    </ScreenContainer>
  );
};

export default DashboardScreen;
