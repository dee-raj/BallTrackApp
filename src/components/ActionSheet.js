import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ActionSheet({ visible, title, options, onCancel }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              {title && <Text style={styles.title}>{title}</Text>}
              
              <View style={styles.optionsContainer}>
                {options.map((opt, index) => (
                  <View key={index}>
                    <TouchableOpacity 
                      style={[styles.optionBtn, index === 0 && styles.firstOption, index === options.length - 1 && styles.lastOption]} 
                      onPress={opt.onPress}
                      activeOpacity={0.6}
                    >
                      <View style={styles.optionContent}>
                        {opt.icon && (
                          <MaterialCommunityIcons 
                            name={opt.icon} 
                            size={22} 
                            color={opt.destructive ? '#EF4444' : '#475569'} 
                            style={styles.optionIcon} 
                          />
                        )}
                        <Text style={[
                          styles.optionText, 
                          opt.destructive && styles.destructiveText,
                          !opt.icon && { textAlign: 'center', width: '100%' }
                        ]}>
                          {opt.text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {index < options.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 20,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  optionBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  destructiveText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  cancelBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
  }
});
