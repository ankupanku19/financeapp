import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { apiService } from '@/services/api';

export default function ApiTestComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testHealthCheck = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('Testing health check...');
      const health = await apiService.healthCheck();
      console.log('Health check result:', health);
      setResult(`✅ Health Check Success: ${JSON.stringify(health, null, 2)}`);
      Alert.alert('Success', 'API connection is working!');
    } catch (error) {
      console.error('Health check failed:', error);
      setResult(`❌ Health Check Failed: ${error.message}`);
      Alert.alert('Error', `API connection failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('Testing login...');
      const loginResult = await apiService.login('test@test.com', 'test123');
      console.log('Login result:', loginResult);
      setResult(`✅ Login Test: ${JSON.stringify(loginResult, null, 2)}`);
    } catch (error) {
      console.error('Login test failed:', error);
      setResult(`❌ Login Test Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testHealthCheck}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Health Check'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Login'}
        </Text>
      </TouchableOpacity>

      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
