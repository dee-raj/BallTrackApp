import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ConfirmModal({ 
  visible, 
  title, 
  message, 
  onCancel, 
  onConfirm, 
  cancelText = 'Cancel', 
  confirmText = 'Confirm',
  type = 'warning' // 'info' | 'warning' | 'danger'
}) {
  const getIconConfig = () => {
    switch (type) {
      case 'danger': return { name: 'alert-circle', color: '#EF4444', bg: '#FEF2F2' };
      case 'info': return { name: 'information', color: '#3B82F6', bg: '#EFF6FF' };
      default: return { name: 'help-circle', color: '#F59E0B', bg: '#FFFBEB' };
    }
  };

  const icon = getIconConfig();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
            <MaterialCommunityIcons name={icon.name} size={32} color={icon.color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttons}>
            <TouchableOpacity 
              style={styles.btnCancel} 
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btnConfirm, type === 'danger' && { backgroundColor: '#EF4444' }]} 
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.btnConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  btnCancelText: {
    fontWeight: '800',
    color: '#64748B',
    fontSize: 15,
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  btnConfirmText: {
    fontWeight: '800',
    color: 'white',
    fontSize: 15,
  }
});
