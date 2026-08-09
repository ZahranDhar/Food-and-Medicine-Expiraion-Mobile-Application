import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { AppStackParamList } from '../../navigation/types';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Header from '../../components/layout/Header';
import PantrySidebar from '../../components/layout/PantrySidebar';
import ProductCard from '../../components/cards/ProductCard';
import Avatar from '../../components/ui/Avatar';
import { ProductCardSkeleton } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { getDaysRemaining } from '../../utils/date';
import { requestPermissions } from '../../notifications/notificationService';

type HomeScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

type FilterType = 'all' | 'active' | 'expiring' | 'expired';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const {
    products,
    isLoading,
    isRefreshing,
    error,
    fetchProducts,
    refreshProducts,
    deleteProduct,
  } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<string>('All Categories');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleDelete = async (productId: string) => {
    if (deletingId) return;
    setDeletingId(productId);
    try {
      await deleteProduct(productId);
    } catch (err: any) {
      Alert.alert('Delete Failed', err.message || 'Could not delete product. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    requestPermissions();
    fetchProducts();
  }, []);

  // Derive categories that actually exist in current products
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => { if (p.category) cats.add(p.category); });
    return ['All Categories', ...Array.from(cats).sort()];
  }, [products]);

  // Filtered and searched product list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeCategory !== 'All Categories') {
        if (product.category !== activeCategory) return false;
      }

      const days = getDaysRemaining(product.expirationDate);
      if (activeFilter === 'expired') return days < 0;
      if (activeFilter === 'expiring') return days >= 0 && days <= 7;
      if (activeFilter === 'active') return days > 7;
      return true;
    });
  }, [products, searchQuery, activeFilter, activeCategory]);

  const headerRight = (
    <TouchableOpacity
      onPress={() => setSidebarVisible(true)}
      className="active:opacity-80"
    >
      <Avatar firstName={user?.firstName} lastName={user?.lastName} size="small" />
    </TouchableOpacity>
  );

  const renderFilterTab = (type: FilterType, label: string) => {
    const isActive = activeFilter === type;
    return (
      <TouchableOpacity
        onPress={() => setActiveFilter(type)}
        className={`px-4 py-2 rounded-full mr-2.5 border 
          ${isActive
            ? 'bg-emerald-500 border-emerald-500'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        activeOpacity={0.7}
      >
        <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-650 dark:text-slate-400'}`}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryTab = (category: string) => {
    const isActive = activeCategory === category;
    return (
      <TouchableOpacity
        key={category}
        onPress={() => setActiveCategory(category)}
        className={`px-4 py-2 rounded-full mr-2.5 border 
          ${isActive
            ? 'bg-violet-500 border-violet-500'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        activeOpacity={0.7}
      >
        <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-650 dark:text-slate-400'}`}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Header title="My Pantry" rightElement={headerRight} />
        <ErrorState message={error} onRetry={fetchProducts} />
      </View>
    );
  }

  const isFiltering = searchQuery || activeFilter !== 'all' || activeCategory !== 'All Categories';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScreenContainer safeArea={true} keyboardAvoiding={false}>
        <Header title="My Pantry" rightElement={headerRight} />

        {/* Search Bar & Filters */}
        <View className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850">
          <View className="flex-row items-center border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 px-4 h-12 rounded-2xl mb-3">
            <Text className="text-base mr-2">🔍</Text>
            <TextInput
              placeholder="Search pantry products..."
              placeholderTextColor="#94a3b8"
              className="flex-1 text-sm text-slate-900 dark:text-white h-full py-0"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              style={{ outlineWidth: 0 } as any}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                <Text className="text-slate-400 font-bold">×</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Freshness Filter */}
          <FlatList
            data={[
              { type: 'all', label: 'All Items' },
              { type: 'active', label: 'Active' },
              { type: 'expiring', label: 'Expiring' },
              { type: 'expired', label: 'Expired' },
            ]}
            keyExtractor={(item) => item.type}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => renderFilterTab(item.type as FilterType, item.label)}
            contentContainerStyle={{ paddingRight: 20, marginBottom: 8 }}
          />

          {/* Category Filter */}
          <FlatList
            data={availableCategories}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => renderCategoryTab(item)}
            contentContainerStyle={{ paddingRight: 20 }}
          />
        </View>

        {/* Main product list */}
        {isLoading && products.length === 0 ? (
          <FlatList
            data={[1, 2, 3, 4, 5]}
            keyExtractor={(item) => item.toString()}
            renderItem={() => <ProductCardSkeleton />}
            contentContainerStyle={{ padding: 16 }}
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title={isFiltering ? 'No Matching Items' : 'Your Pantry is Empty'}
            description={
              isFiltering
                ? 'Try modifying your search queries or filters.'
                : 'Tap the + button to add items and start tracking their shelf life.'
            }
          />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                onDelete={handleDelete}
              />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshProducts}
                colors={['#10b981']}
                tintColor="#10b981"
              />
            }
          />
        )}
      </ScreenContainer>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddProduct')}
        className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-emerald-500 items-center justify-center"
        activeOpacity={0.85}
        style={{
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Two views forming a + cross — avoids font baseline offset issues */}
        <View style={{ width: 22, height: 2.5, backgroundColor: '#fff', borderRadius: 2, position: 'absolute' }} />
        <View style={{ width: 2.5, height: 22, backgroundColor: '#fff', borderRadius: 2, position: 'absolute' }} />
      </TouchableOpacity>

      {/* Sidebar */}
      <PantrySidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        activeScreen="Home"
        onNavigate={(screen) => navigation.navigate(screen as any)}
      />
    </View>
  );
};

export default HomeScreen;
