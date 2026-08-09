import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useProducts } from '../../context/ProductContext';
import { AppStackParamList } from '../../navigation/types';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Header from '../../components/layout/Header';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';

type AddProductScreenProps = NativeStackScreenProps<AppStackParamList, 'AddProduct'>;

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
  'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
  'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=80',
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80',
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
];

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [titleError, setTitleError] = useState('');
  const [imageError, setImageError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const isWeb = Platform.OS === 'web';

  // Gallery picker (native only)
  const pickFromGallery = async () => {
    setImageError('');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your gallery to choose photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageUrlInput('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  // Camera picker (native only)
  const takePhoto = async () => {
    setImageError('');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera access to capture photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageUrlInput('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize camera');
    }
  };

  // Use a random placeholder image
  const useRandomPlaceholder = () => {
    const url = PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
    setImageUri(url);
    setImageUrlInput(url);
    setImageError('');
  };

  // Apply typed URL
  const applyImageUrl = () => {
    if (imageUrlInput.trim().startsWith('http')) {
      setImageUri(imageUrlInput.trim());
      setImageError('');
    } else {
      setImageError('Please enter a valid image URL (starting with http)');
    }
  };

  const validate = (): boolean => {
    let isValid = true;
    setTitleError('');
    setImageError('');
    setCategoryError('');

    if (!title.trim()) {
      setTitleError('Product title is required');
      isValid = false;
    }

    const effectiveImage = imageUri || imageUrlInput.trim();
    if (!effectiveImage) {
      setImageError(
        isWeb
          ? 'Please enter an image URL or use a random placeholder'
          : 'Please select or capture a product image'
      );
      isValid = false;
    }

    if (!selectedCategory) {
      setCategoryError('Please select a category');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const effectiveImage =
      imageUri || imageUrlInput.trim() || PLACEHOLDER_IMAGES[0];

    setIsUploading(true);
    try {
      const newProduct = await addProduct(title.trim(), effectiveImage, selectedCategory);
      Alert.alert(
        'Product Added 🎉',
        `"${newProduct.title}" was registered under ${newProduct.category}.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Could not add product. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScreenContainer safeArea={true} scrollable={true}>
      <Header title="Add Product" showBack={true} />

      <View className="p-5 bg-slate-50 dark:bg-slate-950 flex-1 pb-10">

        {/* Image Section */}
        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">
          {'PRODUCT PHOTO'}
        </Text>

        <View className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-850 p-4 shadow-sm items-center mb-6">
          {imageUri ? (
            <View className="w-full">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-56 rounded-2xl bg-slate-100 mb-4"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => { setImageUri(null); setImageUrlInput(''); }}
                className="bg-slate-50 dark:bg-slate-800 py-3 rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {'Remove Image'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="w-full py-6 items-center">
              <Text className="text-5xl mb-4">📸</Text>
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center mb-1">
                {'No Photo Selected'}
              </Text>

              {/* Web: URL input */}
              {isWeb ? (
                <View className="w-full mt-4">
                  <AppInput
                    label="IMAGE URL"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrlInput}
                    onChangeText={setImageUrlInput}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <View className="flex-row justify-center w-full mb-2">
                    <TouchableOpacity
                      onPress={applyImageUrl}
                      className="bg-emerald-500 active:bg-emerald-600 py-3 px-5 rounded-xl flex-1 mr-2 items-center"
                    >
                      <Text className="text-xs font-bold text-white">{'Use This URL'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={useRandomPlaceholder}
                      className="bg-slate-100 active:bg-slate-200 dark:bg-slate-800 py-3 px-5 rounded-xl flex-1 ml-2 items-center"
                    >
                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">{'Random Image'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Native: Camera / Gallery */
                <View className="flex-row justify-center w-full px-4 mt-4">
                  <TouchableOpacity
                    onPress={takePhoto}
                    className="bg-emerald-500 active:bg-emerald-600 py-3 px-5 rounded-xl flex-1 mr-2 items-center"
                  >
                    <Text className="text-xs font-bold text-white">{'Use Camera'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickFromGallery}
                    className="bg-slate-100 active:bg-slate-200 dark:bg-slate-800 py-3 px-5 rounded-xl flex-1 ml-2 items-center"
                  >
                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">{'Open Gallery'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {imageError ? (
            <Text className="text-xs font-medium text-red-500 mt-2">{imageError}</Text>
          ) : null}
        </View>

        {/* Product Title */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-850 shadow-sm mb-6">
          <AppInput
            label="PRODUCT NAME / TITLE"
            placeholder="e.g. Organic Milk 2L"
            value={title}
            onChangeText={setTitle}
            error={titleError}
            editable={!isUploading}
          />
        </View>

        {/* Category Selector */}
        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">
          {'CATEGORY'}
        </Text>
        <View className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-850 p-5 shadow-sm mb-6">
          <View className="flex-row flex-wrap">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => { setSelectedCategory(cat.value); setCategoryError(''); }}
                  className={`mr-2 mb-2 px-4 py-2 rounded-full border ${isSelected
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {categoryError ? (
            <Text className="text-xs font-medium text-red-500 mt-2">{categoryError}</Text>
          ) : null}
        </View>

        {/* Submit */}
        <View className="px-2">
          <AppButton
            title="Add Product"
            onPress={handleSubmit}
            isLoading={isUploading}
            disabled={isUploading}
          />
        </View>

      </View>
    </ScreenContainer>
  );
};

export default AddProductScreen;
