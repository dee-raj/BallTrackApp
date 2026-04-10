import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GenericScreen({ route }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{route.name}</Text>
      <Text>Coming soon in this drawer option!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' }
});
