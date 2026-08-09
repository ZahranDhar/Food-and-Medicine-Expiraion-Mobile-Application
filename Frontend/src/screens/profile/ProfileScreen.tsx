import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { AppStackParamList } from '../../navigation/types';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Header from '../../components/layout/Header';
import Avatar from '../../components/ui/Avatar';
import DashboardCard from '../../components/cards/DashboardCard';
import AppButton from '../../components/ui/AppButton';

type ProfileScreenProps = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { statistics } = useProducts();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Logout failed');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer safeArea={true} scrollable={true}>
      <Header title="My Profile" showBack={true} />

      <View className="p-4 bg-slate-50 dark:bg-slate-950 flex-1 pb-10">
        
        {/* User Card */}
        <View className="items-center bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-850 shadow-sm mb-6">
          <Avatar 
            firstName={user?.firstName} 
            lastName={user?.lastName} 
            size="large" 
            className="mb-4"
          />
          <Text className="text-xl font-black text-slate-900 dark:text-white">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-4">
            @{user?.username}
          </Text>

          {/* Detailed Info Lines */}
          <View className="w-full border-t border-slate-55 dark:border-slate-800 pt-4 space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                EMAIL ADDRESS
              </Text>
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Dashboard Statistics */}
        <Text className="text-sm font-black text-slate-400 dark:text-slate-550 mb-3 ml-2">
          PANTRY DASHBOARD
        </Text>
        <View className="flex-row flex-wrap justify-between mb-4">
          <DashboardCard
            value={statistics.total}
            label="Total Products"
            type="total"
          />
          <DashboardCard
            value={statistics.active}
            label="Active / Fresh"
            type="active"
          />
          <DashboardCard
            value={statistics.expiring}
            label="Expiring Soon"
            type="expiring"
          />
          <DashboardCard
            value={statistics.expired}
            label="Expired Items"
            type="expired"
          />
        </View>

        {/* Action Buttons */}
        <View className="space-y-3 mt-2 px-2">
          <AppButton
            title="Log Out"
            variant="outline"
            onPress={handleLogout}
            isLoading={isLoggingOut}
          />
        </View>

      </View>
    </ScreenContainer>
  );
};

export default ProfileScreen;
