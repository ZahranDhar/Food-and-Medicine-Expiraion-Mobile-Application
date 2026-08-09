import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { Product } from '../../types/product';
import { getDaysRemaining, getFreshnessStatus, formatDate } from '../../utils/date';
import ConfirmModal from '../ui/ConfirmModal';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onDelete?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onDelete }) => {
  const daysRemaining = getDaysRemaining(product.expirationDate);
  const status = getFreshnessStatus(daysRemaining);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const renderDaysText = () => {
    if (daysRemaining < 0) {
      const d = Math.abs(daysRemaining);
      return `Expired ${d} day${d > 1 ? 's' : ''} ago`;
    }
    if (daysRemaining === 0) return 'Expires today';
    if (daysRemaining === 1) return 'Expires tomorrow';
    return `${daysRemaining} days left`;
  };

  const handleConfirm = () => {
    setConfirmVisible(false);
    setShowDelete(false);
    onDelete?.(product._id);
  };

  const handleCancel = () => {
    setConfirmVisible(false);
    setShowDelete(false);
  };

  return (
    <View className="mb-3">
      <ConfirmModal
        visible={confirmVisible}
        title="Delete Product"
        message={`Remove "${product.title}" from your pantry? Daily notifications for this item will also be cancelled.`}
        confirmLabel="Delete"
        cancelLabel="Keep It"
        destructive
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <TouchableOpacity
        onPress={onPress}
        onLongPress={() => onDelete && setShowDelete((v) => !v)}
        delayLongPress={400}
        className="flex-row items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm active:bg-slate-50 dark:active:bg-slate-850"
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <Image
          source={{ uri: product.image }}
          className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800"
          resizeMode="cover"
        />

        {/* Info */}
        <View className="flex-1 ml-4 justify-center">
          <Text
            className="text-base font-bold text-slate-900 dark:text-white mb-0.5"
            numberOfLines={1}
          >
            {product.title}
          </Text>

          {/* Category Badge */}
          {product.category ? (
            <View className="flex-row mb-1">
              <View className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full self-start">
                <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {product.category}
                </Text>
              </View>
            </View>
          ) : null}

          <Text className="text-xs text-slate-400 dark:text-slate-500 mb-1">
            {'Expires: '}{formatDate(product.expirationDate)}
          </Text>
          <Text className={`text-xs font-semibold ${status.textClass}`}>
            {renderDaysText()}
          </Text>
        </View>

        {/* Status badge */}
        <View className={`px-3 py-1.5 rounded-full ${status.bgClass}`}>
          <Text className={`text-xs font-bold ${status.textClass}`}>
            {status.label}
          </Text>
        </View>

        {/* Delete button — always on web, long-press on native */}
        {(showDelete || Platform.OS === 'web') && onDelete ? (
          <TouchableOpacity
            onPress={() => setConfirmVisible(true)}
            className="ml-3 w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/40 items-center justify-center"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-base">{'🗑️'}</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {/* Long-press hint on native */}
      {showDelete && Platform.OS !== 'web' ? (
        <Text className="text-center text-xs text-slate-400 mt-1">
          {'Tap 🗑️ to delete · tap elsewhere to dismiss'}
        </Text>
      ) : null}
    </View>
  );
};

export default ProductCard;
