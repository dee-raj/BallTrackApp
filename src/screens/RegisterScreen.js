import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions,
  ScrollView, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { register as apiRegister } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const [isShowingPass, setIsShowingPass] = useState(true);

  const handleRegister = async () => {
    if (!fullName || !orgName || !email || !password) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all fields' });
      return;
    }

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(email)) {
      Toast.show({ type: 'error', text1: 'Invalid Email', text2: 'Please enter a valid email' });
      return;
    }

    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password must be at least 6 characters' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRegister(email, password, fullName, orgName);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('tenantId', data.user.tenantId || '');
      setUser(data.user);
      // Auth flow will naturally load Dashboard since User state is set.
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Registration failed', text2: error?.response?.data?.message || 'Check your internet connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerSection}>
          <Text style={styles.appName}>Register Organization</Text>
          <Text style={styles.tagline}>Set up your organization in seconds</Text>
        </View>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>YOUR FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ORGANIZATION / LEAGUE NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dream League Cricket"
                  value={orgName}
                  onChangeText={setOrgName}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ADMIN EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="admin@league.com"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={isShowingPass}
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setIsShowingPass(!isShowingPass)}
                  >
                    <MaterialCommunityIcons
                      name={isShowingPass ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, isLoading && styles.disabledBtn]}
                onPress={handleRegister}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.loginBtnText}>Create Organization</Text>
                    <MaterialCommunityIcons name="shield-check-outline" size={20} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerSection: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  backBtn: {
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
    padding: 10,
    marginLeft: -10,
    backgroundColor: '#08a188ff',
    borderRadius: 50,
  },
  headerSection: {
    margin: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    borderRadius: 14,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingRight: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  eyeToggle: {
    padding: 10,
  },
  eyeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#b4ffefff',
    paddingHorizontal: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 5,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
});
