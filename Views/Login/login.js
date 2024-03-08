import React, { useState } from 'react';
import { Text, View, Image, TextInput, ScrollView, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';


import styles from './style';

const LoginScreen = ({ navigation }) => {
  return (
        <Text style={styles.buttonText}>
            Sign in with Facebook
        </Text>
  );
};

export default LoginScreen;