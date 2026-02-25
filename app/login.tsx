import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, User, Lock, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם משתמש וסיסמה');
      shake();
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(username.trim(), password.trim());
      if (result.success) {
        router.replace('/(tabs)/(reports)' as any);
      } else {
        Alert.alert('שגיאה', result.message);
        shake();
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      Alert.alert('שגיאה', 'שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Shield size={40} color={Colors.accent} />
            </View>
            <Text style={styles.title}>דיווח שטח</Text>
            <Text style={styles.subtitle}>מערכת דיווחי טכנאים</Text>
          </View>

          <Animated.View style={[styles.formCard, { transform: [{ translateX: shakeAnim }] }]}>
            <View style={styles.inputWrapper}>
              <User size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="שם משתמש"
                placeholderTextColor={Colors.textLight}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
                testID="login-username"
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="סיסמה"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
                testID="login-password"
              />
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            testID="login-submit"
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.loginButtonText}>כניסה</Text>
                <ChevronLeft size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>ברירת מחדל: admin / 1234</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    width: '100%',
    maxWidth: 400,
    height: 52,
    borderRadius: 14,
    marginTop: 20,
    gap: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  hint: {
    marginTop: 20,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
});
