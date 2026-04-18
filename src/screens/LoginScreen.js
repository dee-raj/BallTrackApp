import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions,
  ScrollView, TouchableWithoutFeedback, Keyboard, Image,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, continueAsGuest } = useContext(AuthContext);
  const [isShowingPass, setIsShowingPass] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login failed', error?.response?.data?.message || 'Check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#d0ffa3ff"
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Logo Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoCircle}>
                <Image
                  width={60}
                  height={60}
                  source={require('../../assets/icon.png')}
                  style={styles.logoImage}
                  resizeMode="stretch"
                />
                {/* <Text style={styles.logoEmoji}>🏏</Text> */}
              </View>
              {/* <Text style={styles.appName}>BallTrack</Text> */}
              <Text style={styles.tagline}>“Every Ball Matters.”</Text>
            </View>

            {/* Audience First Section */}
            <View style={styles.audienceSection}>
              <Text style={styles.audienceTitle}>Catch the Live Action!</Text>
              <Text style={styles.audienceSub}>Join thousands watching the match live.</Text>
              <TouchableOpacity
                style={styles.primaryGuestBtn}
                onPress={continueAsGuest}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#880a0aff" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.primaryGuestText}>Watch Now as Audience</Text>
                    <MaterialCommunityIcons name="stadium-variant" size={20} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR LOGIN AS OFFICIAL</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Scorer Login Section */}
            <View style={styles.loginForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>OFFICIAL EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@balltrack.com"
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
                <TouchableOpacity
                  style={styles.forgotPassBtn}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPassText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, isLoading && styles.disabledBtn]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.loginBtnText}>Proceed to Scoring Table</Text>
                    <MaterialCommunityIcons name="shield-lock-outline" size={20} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an organization? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback >
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: 40,
  },
  logoCircle: {
    height: 90,
    aspectRatio: 1,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    marginBottom: 15,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: 'bold',
    marginTop: 5,
  },
  audienceSection: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 30,
  },
  audienceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  audienceSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  primaryGuestBtn: {
    backgroundColor: '#1E293B',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  primaryGuestText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    marginHorizontal: 15,
  },
  loginForm: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
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
    padding: 5,
  },
  eyeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  loginBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
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
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginRight: 5,
  },
  forgotPassText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  registerText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  registerLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
