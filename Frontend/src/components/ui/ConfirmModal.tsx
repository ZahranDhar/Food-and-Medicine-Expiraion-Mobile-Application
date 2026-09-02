import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  variant?: 'danger' | 'success' | 'info';
  icon?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  variant,
  icon,
  showCancel = true,
  onConfirm,
  onCancel,
}) => {
  const resolvedVariant = variant || (destructive ? 'danger' : 'info');

  let iconBgColor = '#f0fdf4';
  let iconEmoji = '❓';
  let confirmBtnBgColor = '#10b981';

  if (resolvedVariant === 'danger') {
    iconBgColor = '#fef2f2';
    iconEmoji = icon || '🗑️';
    confirmBtnBgColor = '#ef4444';
  } else if (resolvedVariant === 'success') {
    iconBgColor = '#e8f5e9'; // soft green success background
    iconEmoji = icon || '🎉';
    confirmBtnBgColor = '#10b981';
  } else {
    // info
    iconBgColor = '#f0fdf4';
    iconEmoji = icon || '❓';
    confirmBtnBgColor = '#10b981';
  }

  const handleDismiss = onCancel || onConfirm;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      {/* Dimmed backdrop — tap outside to cancel */}
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          }}
        >
          {/* Card — stop backdrop tap from propagating */}
          <TouchableWithoutFeedback>
            <View
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: 28,
                width: '100%',
                maxWidth: 380,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 20,
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: iconBgColor,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                  alignSelf: 'center',
                }}
              >
                <Text style={{ fontSize: 26 }}>{iconEmoji}</Text>
              </View>

              {/* Title */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: '#0f172a',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={{
                  fontSize: 14,
                  color: '#64748b',
                  textAlign: 'center',
                  lineHeight: 20,
                  marginBottom: 24,
                }}
              >
                {message}
              </Text>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Cancel */}
                {showCancel && onCancel && (
                  <TouchableOpacity
                    onPress={onCancel}
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: '#f1f5f9',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#475569',
                      }}
                    >
                      {cancelLabel}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Confirm */}
                <TouchableOpacity
                  onPress={onConfirm}
                  activeOpacity={0.75}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: confirmBtnBgColor,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#ffffff',
                    }}
                  >
                    {confirmLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ConfirmModal;
