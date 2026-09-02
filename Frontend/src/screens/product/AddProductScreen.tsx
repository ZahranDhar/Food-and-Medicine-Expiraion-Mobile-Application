import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useProducts } from '../../context/ProductContext';
import { AppStackParamList } from '../../navigation/types';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Header from '../../components/layout/Header';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import ConfirmModal from '../../components/ui/ConfirmModal';

type AddProductScreenProps = NativeStackScreenProps<AppStackParamList, 'AddProduct'>;

const CATEGORIES = [
  { label: '🍎 Fruits', value: 'Fruits' },
  { label: '🥦 Vegetables', value: 'Vegetables' },
  { label: '🥛 Dairy', value: 'Dairy' },
  { label: '🍞 Bakery', value: 'Bakery' },
  { label: '🥩 Meat', value: 'Meat' },
  { label: '🐟 Seafood', value: 'Seafood' },
  { label: '💊 Medicines', value: 'Medicines' },
  { label: '🥫 Canned Goods', value: 'Canned Goods' },
  { label: '🧃 Beverages', value: 'Beverages' },
  { label: '🍫 Snacks', value: 'Snacks' },
  { label: '🧊 Frozen', value: 'Frozen' },
  { label: '📦 Other', value: 'Other' },
];

export const AddProductScreen: React.FC<AddProductScreenProps> = ({ navigation }) => {
  const { addProduct } = useProducts();

  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Two separate image states
  const [labelImageUri, setLabelImageUri] = useState<string | null>(null);
  const [productImageUri, setProductImageUri] = useState<string | null>(null);

  // Error states
  const [titleError, setTitleError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [labelImageError, setLabelImageError] = useState('');
  const [productImageError, setProductImageError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Alert/Modal state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant?: 'success' | 'danger' | 'info';
    icon?: string;
    confirmLabel?: string;
    showCancel?: boolean;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (
    title: string,
    message: string,
    onConfirm: () => void = () => setAlertConfig((prev) => ({ ...prev, visible: false })),
    variant: 'success' | 'danger' | 'info' = 'info',
    icon?: string,
    confirmLabel: string = 'OK',
    showCancel: boolean = false
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      variant,
      icon,
      confirmLabel,
      showCancel,
      onConfirm,
    });
  };

  // ─── Image Picker Helpers ──────────────────────────────────────────────────

  const pickImage = async (
    target: 'label' | 'product',
    source: 'camera' | 'gallery'
  ) => {
    if (target === 'label') setLabelImageError('');
    if (target === 'product') setProductImageError('');

    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert(
            'Permission Denied',
            'We need camera access to capture photos.',
            undefined,
            'info',
            '⚠️'
          );
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.5,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          if (target === 'label') setLabelImageUri(result.assets[0].uri);
          else setProductImageUri(result.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert(
            'Permission Denied',
            'We need access to your gallery to choose photos.',
            undefined,
            'info',
            '⚠️'
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.5,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          if (target === 'label') setLabelImageUri(result.assets[0].uri);
          else setProductImageUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      showAlert(
        'Error',
        `Failed to select photo for ${target === 'label' ? 'expiration label' : 'product'}`,
        undefined,
        'danger',
        '⚠️'
      );
    }
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    let isValid = true;
    setTitleError('');
    setCategoryError('');
    setLabelImageError('');
    setProductImageError('');

    if (!title.trim()) {
      setTitleError('Product title is required');
      isValid = false;
    }

    if (!selectedCategory) {
      setCategoryError('Please select a category');
      isValid = false;
    }

    if (!labelImageUri) {
      setLabelImageError('Expiration / Label photo is required for OCR date detection');
      isValid = false;
    }

    if (!productImageUri) {
      setProductImageError('Product photograph is required for display');
      isValid = false;
    }

    return isValid;
  };

  // ─── Form Submission ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!labelImageUri || !productImageUri) return;

    setIsUploading(true);
    try {
      const newProduct = await addProduct(
        title.trim(),
        labelImageUri,
        productImageUri,
        selectedCategory
      );
      showAlert(
        'Product Added 🎉',
        `"${newProduct.title}" was registered under ${newProduct.category}.`,
        () => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          navigation.navigate('Home');
        },
        'success',
        '🎉',
        'OK',
        false
      );
    } catch (error: any) {
      if (error.status === 422) {
        showAlert(
          'Expiration Date Not Detected 🔍',
          error.message ||
            'Could not find a valid expiration date in the label image. Please take a clearer photo showing the expiry date label and try again.',
          undefined,
          'info',
          '🔍',
          'OK',
          false
        );
      } else {
        showAlert(
          'Upload Failed',
          error.message || 'Could not add product. Please try again.',
          undefined,
          'danger',
          '⚠️',
          'OK',
          false
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Camera Icon Component ─────────────────────────────────────────────────

  const CameraIcon = () => (
    <View className="items-center justify-center mb-3">
      {/* Shutter button */}
      <View className="w-4 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-t-sm -mb-px" />
      {/* Camera Body */}
      <View className="w-16 h-11 bg-slate-50 dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-500 rounded-xl items-center justify-center">
        {/* Lens */}
        <View className="w-7 h-7 rounded-full border-2 border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-900 items-center justify-center">
          {/* Lens inner circle */}
          <View className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500" />
        </View>
      </View>
    </View>
  );

  // ─── Helper component for Image Card ───────────────────────────────────────

  const renderImageCard = (
    title: string,
    imageUri: string | null,
    errorText: string,
    onRemove: () => void,
    onCamera: () => void,
    onGallery: () => void
  ) => (
    <View className="mb-6">
      <View className="mb-2 ml-1">
        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {title}
        </Text>
      </View>

      <View className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-850 p-4 shadow-sm items-center">
        {imageUri ? (
          <View className="w-full">
            <Image
              source={{ uri: imageUri }}
              className="w-full h-48 rounded-2xl bg-slate-100 mb-3"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={onRemove}
              className="bg-slate-50 dark:bg-slate-800 py-2.5 rounded-xl items-center"
            >
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {'Remove Image'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="w-full py-4 items-center">
            <CameraIcon />
            <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center mb-3">
              {'No Photo Selected'}
            </Text>

            <View className="flex-row justify-center w-full px-2">
              <TouchableOpacity
                onPress={onCamera}
                className="bg-emerald-500 active:bg-emerald-600 py-2.5 px-4 rounded-xl flex-1 mr-2 items-center"
              >
                <Text className="text-xs font-bold text-white">{'Use Camera'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onGallery}
                className="bg-slate-100 active:bg-slate-200 dark:bg-slate-800 py-2.5 px-4 rounded-xl flex-1 ml-2 items-center"
              >
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">{'Open Gallery'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {errorText ? (
        <Text className="text-rose-500 text-xs mt-1.5 ml-2 font-medium">
          {errorText}
        </Text>
      ) : null}
    </View>
  );

  return (
    <ScreenContainer safeArea={true} scrollable={true}>
      <Header title="Add Product" showBack={true} />

      <ConfirmModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
        icon={alertConfig.icon}
        confirmLabel={alertConfig.confirmLabel}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onCancel={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      <View className="p-5 bg-slate-50 dark:bg-slate-950 flex-1 pb-10">
        {/* Section 1: Expiration / Label Image */}
        {renderImageCard(
          '1. EXPIRATION / LABEL IMAGE',
          labelImageUri,
          labelImageError,
          () => setLabelImageUri(null),
          () => pickImage('label', 'camera'),
          () => pickImage('label', 'gallery')
        )}

        {/* Section 2: Actual Product Photograph */}
        {renderImageCard(
          '2. ACTUAL PRODUCT IMAGE',
          productImageUri,
          productImageError,
          () => setProductImageUri(null),
          () => pickImage('product', 'camera'),
          () => pickImage('product', 'gallery')
        )}

        {/* Product Title */}
        <View className="mb-5">
          <AppInput
            label="PRODUCT TITLE"
            placeholder="e.g. Organic Whole Milk 2L"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError) setTitleError('');
            }}
            error={titleError}
          />
        </View>

        {/* Category Selector */}
        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">
          {'CATEGORY'}
        </Text>
        <View className="flex-row flex-wrap mb-4">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => {
                  setSelectedCategory(cat.value);
                  if (categoryError) setCategoryError('');
                }}
                className={`mr-2 mb-2 px-3.5 py-2 rounded-xl border ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-950/40 dark:border-emerald-500'
                    : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {categoryError ? (
          <Text className="text-rose-500 text-xs mb-4 ml-2 font-medium">
            {categoryError}
          </Text>
        ) : null}

        {/* Submit Button */}
        <View className="mt-4 mb-8">
          <AppButton
            title={isUploading ? 'Extracting Expiry & Uploading...' : 'Add Product'}
            onPress={handleSubmit}
            isLoading={isUploading}
            variant="primary"
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

export default AddProductScreen;
