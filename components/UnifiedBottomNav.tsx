import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, Href } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export const UnifiedBottomNav = () => {
  const { colors } = useTheme();
  const { userType } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Define hidden routes where navigation should not appear
  const hiddenRoutes = ['/login', '/signup', '/washer-signup', '/Splashscreen', '/index', '/', '/home', '/washer-pending'];

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  // Determine which nav items to show based on userType
  const navItems = userType === 'provider' 
    ? [
        { key: 'home', icon: 'home', label: 'Home', route: '/washer-home' },
        { key: 'jobs', icon: 'briefcase', label: 'My Jobs', route: '/myjobs' },
        { key: 'earnings', icon: 'cash', label: 'Earnings', route: '/washer-home' }, // Earnings points back to home for now as per original code
        { key: 'shop', icon: 'cart', label: 'Shop', route: '/marketplace' },
        { key: 'profile', icon: 'person', label: 'Profile', route: '/profile' },
      ]
    : [
        { key: 'browse', icon: 'search', label: 'Browse', route: '/service-browse' },
        { key: 'bookings', icon: 'calendar', label: 'Bookings', route: '/booking-list' },
        { key: 'plans', icon: 'shield-checkmark', label: 'Plans', route: '/subscriptions' },
        { key: 'account', icon: 'person', label: 'Account', route: '/profile' },
      ];

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
      {navItems.map((item) => (
        <NavButton
          key={item.key}
          item={item}
          isActive={pathname === item.route}
          onPress={() => router.push(item.route as Href)}
          colors={colors}
        />
      ))}
    </View>
  );
};

const NavButton = ({ item, isActive, onPress, colors }: any) => {
  const animatedValue = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [isActive]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.navItem}
    >
      <Animated.View style={{ transform: [{ scale }, { translateY }], alignItems: 'center' }}>
        <Ionicons
          name={isActive ? (item.icon as any) : (`${item.icon}-outline` as any)}
          size={24}
          color={isActive ? colors.accent : colors.textSecondary}
        />
        <Animated.Text
          style={[
            styles.label,
            {
              color: isActive ? colors.accent : colors.textSecondary,
              fontWeight: isActive ? '600' : '400',
              opacity: animatedValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.7, 0.8, 1],
              }),
            },
          ]}
        >
          {item.label}
        </Animated.Text>
      </Animated.View>
      {isActive && (
        <Animated.View 
          style={[
            styles.dot, 
            { 
              backgroundColor: colors.accent,
              transform: [{ scale: animatedValue }],
              opacity: animatedValue
            }
          ]} 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 88 : 68,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 4,
  },
  dot: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  }
});
