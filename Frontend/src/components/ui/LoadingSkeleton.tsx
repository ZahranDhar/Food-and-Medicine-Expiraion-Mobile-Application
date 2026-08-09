import React from 'react';
import { View } from 'react-native';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <View 
      className={`bg-slate-200 dark:bg-slate-800 rounded-md ${className}`} 
      style={{ opacity: 0.7 }}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <View className="flex-row p-4 mb-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm items-center">
      {/* Image skeleton */}
      <Skeleton className="w-16 h-16 rounded-xl mr-4" />
      
      {/* Title & info skeletons */}
      <View className="flex-1 justify-center">
        <Skeleton className="h-4 w-3/4 rounded mb-2" />
        <Skeleton className="h-3 w-1/2 rounded mb-2" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </View>

      {/* Badge skeleton */}
      <Skeleton className="w-20 h-6 rounded-full" />
    </View>
  );
};

export const DashboardCardSkeleton: React.FC = () => {
  return (
    <View className="w-[47%] p-4 mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm justify-between">
      <Skeleton className="w-10 h-10 rounded-xl mb-3" />
      <Skeleton className="h-4 w-3/4 rounded mb-2" />
      <Skeleton className="h-6 w-1/3 rounded" />
    </View>
  );
};
