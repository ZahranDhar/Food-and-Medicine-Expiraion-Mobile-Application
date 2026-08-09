import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
  useColorScheme,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import ConfirmModal from '../ui/ConfirmModal';
import Avatar from '../ui/Avatar';

const SIDEBAR_WIDTH = 300;

interface PantrySidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: 'Home' | 'AddProduct' | 'Dashboard') => void;
  activeScreen?: string;
}

export const PantrySidebar: React.FC<PantrySidebarProps> = ({
  visible,
  onClose,
  onNavigate,
  activeScreen,
}) => {
  const { user, logout } = useAuth();
  const { statistics } = useProducts();
  const colorScheme = useColorScheme();
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  const isDark = colorScheme === 'dark';

  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const doLogout = async () => {
    setLogoutModalVisible(false);
    onClose();
    try {
      await logout();
    } catch (e: any) {
      Alert.alert('Error', (e as any).message || 'Logout failed');
    }
  };

  const navItem = (
    icon: string,
    label: string,
    screen: 'Home' | 'AddProduct' | 'Dashboard',
    isActive?: boolean
  ) => (
    <TouchableOpacity
      key={screen}
      onPress={() => { onClose(); setTimeout(() => onNavigate(screen), 220); }}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 16,
        marginBottom: 6,
        backgroundColor: isActive
          ? isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5'
          : 'transparent',
        borderWidth: 1,
        borderColor: isActive
          ? isDark ? 'rgba(16,185,129,0.4)' : '#a7f3d0'
          : 'transparent',
      }}
    >
      <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>
      <Text style={{
        fontSize: 15,
        fontWeight: '700',
        color: isActive
          ? isDark ? '#34d399' : '#047857'
          : isDark ? '#cbd5e1' : '#374151',
        flex: 1,
      }}>
        {label}
      </Text>
      {isActive && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
      )}
    </TouchableOpacity>
  );

  if (!mounted) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100,
      }}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: overlayAnim,
          }}
        />
      </TouchableWithoutFeedback>

      {/* Sidebar panel — use explicit style, NOT className, so Animated.View renders correctly */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: SIDEBAR_WIDTH,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          transform: [{ translateX: slideAnim }],
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 20,
        }}
      >
        {/* Header */}
        <View style={{ backgroundColor: '#10b981', paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}>
          <Avatar firstName={user?.firstName} lastName={user?.lastName} size="large" />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 12 }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{ color: '#a7f3d0', fontSize: 12, fontWeight: '600' }}>
            @{user?.username}
          </Text>
          <Text style={{ color: '#a7f3d0', fontSize: 12, marginTop: 2 }}>
            {user?.email}
          </Text>
        </View>

        {/* Nav links */}
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#94a3b8', marginBottom: 8, marginLeft: 4, letterSpacing: 1 }}>
            NAVIGATION
          </Text>
          {navItem('🏠', 'My Pantry', 'Home', activeScreen === 'Home')}
          {navItem('📊', 'Dashboard', 'Dashboard', activeScreen === 'Dashboard')}
        </View>

        {/* Logout */}
        <View style={{
          paddingHorizontal: 16,
          paddingBottom: 40,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
        }}>
          <ConfirmModal
            visible={logoutModalVisible}
            title="Log Out"
            message="Are you sure you want to log out of your account?"
            confirmLabel="Log Out"
            cancelLabel="Cancel"
            destructive
            onConfirm={doLogout}
            onCancel={() => setLogoutModalVisible(false)}
          />
          <TouchableOpacity
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fff1f2',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecdd3',
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>🚪</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#f87171' : '#dc2626' }}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default PantrySidebar;
