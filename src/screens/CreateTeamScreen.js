import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import ActionSheet from '../components/ActionSheet';
import * as ImagePicker from 'expo-image-picker';
import { createTeam } from '../api/teams';
import { uploadImage } from '../api/uploads';

export default function CreateTeamScreen({ navigation }) {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [homeGround, setHomeGround] = useState('');
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  const handleCamera = async () => {
    setActionSheetVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'We need camera access to take photos.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) setLogo(result.assets[0].uri);
  };

  const handleLibrary = async () => {
    setActionSheetVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) setLogo(result.assets[0].uri);
  };

  const handleLogoUpload = () => {
    setActionSheetVisible(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Team name is required' });
      return;
    }
    if (!logo) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Team logo is required for branding.' });
      return;
    }
    try {
      setLoading(true);

      let finalLogoUrl = logo;

      // If it's a local URI, upload it
      if (logo && (logo.startsWith('file://') || logo.startsWith('content://'))) {
        try {
          const uploadResult = await uploadImage(logo);
          finalLogoUrl = uploadResult.url;
        } catch (uploadErr) {
          console.log('Logo upload failed', uploadErr);
          Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Could not upload team logo. Please try again.' });
          setLoading(false);
          return;
        }
      }

      await createTeam({
        name,
        shortName: shortName || undefined,
        homeGround: homeGround || undefined,
        logoUrl: finalLogoUrl,
      });
      Toast.show({ type: 'success', text1: 'Success', text2: 'New team created successfully!' });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message || 'Could not create team' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={styles.title}>New Team Registry</Text>
              <Text style={styles.subtitle}>Define your team's identity</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Identity & Branding</Text>

              <View style={styles.logoSection}>
                <TouchableOpacity style={styles.logoBtn} onPress={handleLogoUpload}>
                  {logo ? (
                    <Image source={{ uri: logo }} style={styles.logoPreview} />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <MaterialCommunityIcons name="shield-outline" size={30} color="#64748B" />
                      <Text style={styles.uploadText}>Upload</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.logoInfo}>
                  <Text style={styles.logoInfoTitle}>Team Crest</Text>
                  <Text style={styles.logoInfoSub}>Tap to upload logo</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>OFFICIAL TEAM NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mumbai Indians"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SHORT NAME (ABBREVIATION)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MI, CSK, RCB"
                  placeholderTextColor="#94A3B8"
                  value={shortName}
                  onChangeText={setShortName}
                  autoCapitalize="characters"
                  maxLength={5}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HOME GROUND / VENUE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Wankhede Stadium"
                  placeholderTextColor="#94A3B8"
                  value={homeGround}
                  onChangeText={setHomeGround}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreate}
              disabled={loading}
            >
              <View style={styles.btnContent}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Finalize Registry</Text>
                    <MaterialCommunityIcons name="cricket" size={20} color="white" />
                  </>
                )}
              </View>
            </TouchableOpacity>
            <ActionSheet
              visible={actionSheetVisible}
              title="Choose a logo source"
              options={[
                { text: 'Camera', onPress: handleCamera, icon: 'camera' },
                { text: 'Library', onPress: handleLibrary, icon: 'image-multiple' }
              ]}
              onCancel={() => setActionSheetVisible(false)}
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 25,
    backgroundColor: '#fffbebff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 25,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoPlaceholderEmoji: {
    fontSize: 24,
  },
  uploadText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 2,
  },
  logoInfo: {
    marginLeft: 15,
  },
  logoInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  logoInfoSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  submitBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

