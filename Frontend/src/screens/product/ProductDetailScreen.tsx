import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProducts } from '../../context/ProductContext';
import { AppStackParamList } from '../../navigation/types';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Header from '../../components/layout/Header';
import AppButton from '../../components/ui/AppButton';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { getDaysRemaining, getFreshnessStatus, formatDate } from '../../utils/date';

type ProductDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'ProductDetail'>;

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ route, navigation }) => {
  const { productId } = route.params;
  const { products, deleteProduct } = useProducts();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Retrieve matching product from context
  const product = products.find((p) => p._id === productId);

  if (!product) {
    return (
      <ScreenContainer safeArea={true}>
        <Header title="Product Detail" showBack={true} />
        <View className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
          <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Product Not Found
          </Text>
          <Text className="text-sm text-slate-400 dark:text-slate-500 mb-6 text-center">
            This product might have been deleted or doesn't exist anymore.
          </Text>
          <AppButton title="Go Back" onPress={() => navigation.goBack()} size="medium" />
        </View>
      </ScreenContainer>
    );
  }

  const daysRemaining = getDaysRemaining(product.expirationDate);
  const status = getFreshnessStatus(daysRemaining);

  const getStatusLabelText = () => {
    switch (status.statusType) {
      case 'expired':
        return 'Expired';
      case 'expiring':
        return 'Expiring Soon';
      case 'active':
        return 'Fresh / Active';
    }
  };

  const renderDaysText = () => {
    if (daysRemaining < 0) {
      const positiveDays = Math.abs(daysRemaining);
      return `Expired ${positiveDays} day${positiveDays > 1 ? 's' : ''} ago`;
    } else if (daysRemaining === 0) {
      return 'Expires today';
    } else if (daysRemaining === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${daysRemaining} days`;
    }
  };

  const handleDelete = async () => {
    setConfirmVisible(false);
    setIsDeleting(true);
    try {
      await deleteProduct(product._id);
      navigation.goBack();
    } catch (err: any) {
      window.alert?.(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScreenContainer safeArea={true} scrollable={true}>
      <Header title="Product Detail" showBack={true} />

      <ConfirmModal
        visible={confirmVisible}
        title="Delete Product"
        message={`Remove "${product.title}" from your pantry?\n\nThis cannot be undone and daily notifications for this item will be cancelled.`}
        confirmLabel="Delete"
        cancelLabel="Keep It"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />

      <View className="p-4 bg-slate-50 dark:bg-slate-950 flex-1 pb-10">
        {/* Main Card */}
        <View className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-850 shadow-sm overflow-hidden mb-6">
          
          {/* Large Image */}
          <Image
            source={{ uri: product.image }}
            className="w-full h-72 bg-slate-100 dark:bg-slate-800"
            resizeMode="cover"
          />

          {/* Details Content */}
          <View className="p-6">
            
            {/* Status Banner */}
            <View className={`flex-row items-center self-start px-3.5 py-1.5 rounded-full mb-4 ${status.bgClass}`}>
              <View className={`w-2.5 h-2.5 rounded-full mr-2 ${status.colorClass}`} />
              <Text className={`text-xs font-black ${status.textClass}`}>
                {getStatusLabelText().toUpperCase()}
              </Text>
            </View>

            {/* Title */}
            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-4">
              {product.title}
            </Text>

            {/* Shelf-Life Indicators */}
            <View className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm font-semibold text-slate-400 dark:text-slate-550">
                  Status Details
                </Text>
                <Text className={`text-sm font-black ${status.textClass}`}>
                  {renderDaysText()}
                </Text>
              </View>
              <View className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <View 
                  className={`h-full ${status.colorClass}`} 
                  style={{ width: daysRemaining < 0 ? '100%' : `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                />
              </View>
            </View>

            {/* Timestamps Info Grid */}
            <View className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Expiration Date
                </Text>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {formatDate(product.expirationDate)}
                </Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Added to Pantry
                </Text>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {formatDate(product.createdAt)}
                </Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Category
                </Text>
                {product.category ? (
                  <View className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-0.5 rounded-full">
                    <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {product.category}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-sm font-bold text-slate-400">—</Text>
                )}
              </View>
            </View>

          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3 px-2">
          <AppButton
            title="Delete Product"
            variant="danger"
            onPress={() => setConfirmVisible(true)}
            isLoading={isDeleting}
          />
          <AppButton
            title="Go Back"
            variant="secondary"
            onPress={() => navigation.goBack()}
            className="mt-3"
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

export default ProductDetailScreen;
