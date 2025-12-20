import { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Key used for local device storage
const STORAGE_KEY = '@bmi_history_v2';

/**
 * Helper: Returns the health category string based on BMI value
 */
const getBMICategory = (bmi) => {
  const value = parseFloat(bmi);
  if (value < 18.5) return 'Underweight';
  if (value < 25) return 'Normal Weight';
  if (value < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Helper: Returns a color hex code based on BMI health status
 */
const getBMIColor = (bmi) => {
  const value = parseFloat(bmi);
  if (value < 18.5) return '#38bdf8'; // Light Blue
  if (value < 25) return '#4ade80';   // Green
  if (value < 30) return '#fbbf24';   // Yellow/Amber
  return '#f87171';                   // Red
};

export default function App() {
  // --- State Hooks ---
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [unit, setUnit] = useState('metric'); // 'metric' or 'imperial'
  const [history, setHistory] = useState([]);

  // --- Animation Hooks ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Load history from storage on initial app mount
  useEffect(() => {
    loadHistory();
  }, []);

  /**
   * Fetches the saved BMI history from AsyncStorage
   */
  const loadHistory = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData !== null) setHistory(JSON.parse(storedData));
    } catch (e) { 
      console.log("Error loading storage"); 
    }
  };

  /**
   * Persists the current history state to AsyncStorage
   */
  const saveHistoryToStorage = async (newHistory) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) { 
      console.log("Error saving storage"); 
    }
  };

  /**
   * Unified alert handler for Web and Mobile platforms
   */
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  /**
   * Core Logic: Validates input, converts units, calculates BMI, and saves to history
   */
  const calculateBMI = () => {
    Keyboard.dismiss(); // Hide keyboard on mobile
    const hRaw = height.trim();
    const wRaw = weight.trim();

    // Validation
    if (hRaw === '' || wRaw === '') {
      showAlert("Missing Data", "Please enter height and weight.");
      return;
    }

    const hNum = parseFloat(hRaw);
    const wNum = parseFloat(wRaw);

    if (hNum <= 0 || wNum <= 0) {
      showAlert("Invalid Input", "Values must be greater than zero.");
      return;
    }

    let h = hNum;
    let w = wNum;

    // Unit Conversion Logic
    if (unit === 'imperial') {
      h = h * 0.0254;      // inches to meters
      w = w * 0.453592;    // lbs to kg
    } else {
      h = h / 100;         // cm to meters
    }

    // BMI Formula: weight (kg) / [height (m)]^2
    const bmiValue = w / (h * h);
    const rounded = bmiValue.toFixed(1);
    setBmi(rounded);

    // Create a new history object with a unique ID
    const newItem = {
      id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      bmi: rounded,
      category: getBMICategory(bmiValue),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      color: getBMIColor(bmiValue)
    };

    // Update state and storage
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    saveHistoryToStorage(updatedHistory);

    // Reset and trigger Entry Animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 600, 
        useNativeDriver: Platform.OS !== 'web' 
      }),
      Animated.spring(slideAnim, { 
        toValue: 0, 
        friction: 8, 
        useNativeDriver: Platform.OS !== 'web' 
      })
    ]).start();
  };

  /**
   * Deletes a specific item from the list based on ID
   */
  const deleteItem = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    saveHistoryToStorage(updatedHistory);
  };

  /**
   * Wipes all history data
   */
  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  /**
   * Resets the input fields and current result
   */
  const clearForm = () => {
    setHeight('');
    setWeight('');
    setBmi(null);
  };

  /**
   * Calculates the left-offset percentage for the visual gauge needle
   */
  const getIndicatorPosition = () => {
    if (!bmi) return '0%';
    const val = parseFloat(bmi);
    // Scale 15 (min) to 40 (max) into a 0-100% range
    let percentage = ((val - 15) / (40 - 15)) * 100;
    return `${Math.min(Math.max(percentage, 0), 100)}%`;
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {/* --- Header Section --- */}
      <View style={styles.headerBackground}>
        <LinearGradient colors={['#1e293b', '#334155']} style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>BMI Calculator</Text>
          <Text style={styles.headerSubtitle}>Professional Health Tool</Text>
        </View>
      </View>

      {/* Main UI Body */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.contentContainer}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* --- Input Form Card --- */}
            <View style={styles.card}>
              {/* Metric/Imperial Selector */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, unit === 'metric' && styles.toggleBtnActive]} 
                  onPress={() => setUnit('metric')}
                >
                  <Text style={[styles.toggleText, unit === 'metric' && styles.toggleTextActive]}>Metric</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, unit === 'imperial' && styles.toggleBtnActive]} 
                  onPress={() => setUnit('imperial')}
                >
                  <Text style={[styles.toggleText, unit === 'imperial' && styles.toggleTextActive]}>Imperial</Text>
                </TouchableOpacity>
              </View>

              {/* Height Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.iconBox}><MaterialCommunityIcons name="ruler" size={22} color="#64748b" /></View>
                <View style={styles.inputTextContainer}>
                  <Text style={styles.inputLabel}>Height</Text>
                  <TextInput 
                    style={styles.textInput} 
                    placeholder="0" 
                    keyboardType="numeric" 
                    value={height} 
                    onChangeText={setHeight} 
                  />
                </View>
                <Text style={styles.unitSuffix}>{unit === 'metric' ? 'cm' : 'in'}</Text>
              </View>
              
              <View style={styles.divider} />
              
              {/* Weight Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.iconBox}><FontAwesome5 name="weight" size={18} color="#64748b" /></View>
                <View style={styles.inputTextContainer}>
                  <Text style={styles.inputLabel}>Weight</Text>
                  <TextInput 
                    style={styles.textInput} 
                    placeholder="0" 
                    keyboardType="numeric" 
                    value={weight} 
                    onChangeText={setWeight} 
                  />
                </View>
                <Text style={styles.unitSuffix}>{unit === 'metric' ? 'kg' : 'lbs'}</Text>
              </View>

              {/* Calculate Button */}
              <TouchableOpacity style={styles.calculateBtn} onPress={calculateBMI}>
                <LinearGradient colors={['#4f46e5', '#4338ca']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                  <Text style={styles.calculateBtnText}>Calculate Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* --- Animated Result Card --- */}
            {bmi && (
              <Animated.View style={[styles.resultCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>Your Result</Text>
                  <TouchableOpacity onPress={clearForm}><Ionicons name="refresh" size={20} color="#94a3b8" /></TouchableOpacity>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.bmiBigText, { color: getBMIColor(bmi) }]}>{bmi}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: getBMIColor(bmi) + '20' }]}>
                    <Text style={[styles.categoryText, { color: getBMIColor(bmi) }]}>{getBMICategory(bmi)}</Text>
                  </View>
                </View>
                {/* Visual BMI Range Bar */}
                <View style={styles.barContainer}>
                  <LinearGradient 
                    colors={['#38bdf8', '#4ade80', '#fbbf24', '#f87171']} 
                    start={{x: 0, y: 0}} 
                    end={{x: 1, y: 0}} 
                    style={styles.gradientBar} 
                  />
                  <View style={[styles.indicator, { left: getIndicatorPosition() }]} />
                </View>
              </Animated.View>
            )}

            {/* --- History List Section --- */}
            {history.length > 0 && (
              <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                  <Text style={styles.sectionTitle}>History</Text>
                  <TouchableOpacity onPress={clearHistory}><Text style={styles.clearHistoryText}>Clear All</Text></TouchableOpacity>
                </View>
                {history.map((item, index) => (
                  <View key={item.id || `history-${index}`} style={styles.historyCard}>
                    {/* Color-coded indicator strip */}
                    <View style={[styles.historyIndicator, { backgroundColor: item.color }]} />
                    <View style={styles.historyContent}>
                      <Text style={styles.historyBmi}>{item.bmi}</Text>
                      <Text style={styles.historyCategory}>{item.category}</Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyDate}>{item.date}</Text>
                      <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}>
                         <Ionicons name="trash-outline" size={18} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  // --- Global Container ---
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#f1f5f9' 
  },
  contentContainer: { 
    flex: 1, 
    marginTop: 140, 
    paddingHorizontal: 20 
  },

  // --- Header Styling ---
  headerBackground: { 
    height: 240, 
    width: '100%', 
    paddingTop: 60, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40, 
    position: 'absolute', 
    top: 0 
  },
  headerContent: { 
    alignItems: 'center' 
  },
  headerTitle: { 
    color: '#ffffff', 
    fontSize: 28, 
    fontWeight: '900', 
    letterSpacing: 0.5 
  },
  headerSubtitle: { 
    color: '#cbd5e1', 
    fontSize: 14, 
    marginTop: 6, 
    fontWeight: '500' 
  },

  // --- Main Input Card ---
  card: { 
    backgroundColor: '#ffffff', 
    borderRadius: 30, 
    padding: 24, 
    elevation: 10, 
    marginBottom: 20, 
    shadowColor: '#64748b', 
    shadowOpacity: 0.15, 
    shadowRadius: 20, 
    shadowOffset: { width: 0, height: 10 } 
  },

  // --- Unit Toggle Selector ---
  toggleContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    padding: 6, 
    marginBottom: 25, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  toggleBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 12 
  },
  toggleBtnActive: { 
    backgroundColor: '#ffffff', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  toggleText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#94a3b8' 
  },
  toggleTextActive: { 
    color: '#4f46e5' 
  },

  // --- Form Inputs ---
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 8 
  },
  iconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: '#f1f5f9', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  inputTextContainer: { 
    flex: 1 
  },
  inputLabel: { 
    fontSize: 12, 
    color: '#64748b', 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: 2 
  },
  textInput: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#0f172a', 
    padding: 0 
  },
  unitSuffix: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#94a3b8' 
  },
  divider: { 
    height: 1.5, 
    backgroundColor: '#f1f5f9', 
    marginVertical: 15 
  },

  // --- Buttons ---
  calculateBtn: { 
    marginTop: 20 
  },
  gradientBtn: { 
    paddingVertical: 18, 
    borderRadius: 20, 
    alignItems: 'center', 
    shadowColor: '#4f46e5', 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 5 } 
  },
  calculateBtnText: { 
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: '800', 
    letterSpacing: 0.5 
  },

  // --- Result Display Card ---
  resultCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 30, 
    padding: 24, 
    elevation: 5, 
    marginBottom: 25, 
    borderWidth: 1, 
    borderColor: '#f1f5f9' 
  },
  resultHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  resultTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#1e293b' 
  },
  scoreContainer: { 
    alignItems: 'center', 
    marginBottom: 25 
  },
  bmiBigText: { 
    fontSize: 64, 
    fontWeight: '900', 
    letterSpacing: -2 
  },
  categoryBadge: { 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 12, 
    marginTop: -5 
  },
  categoryText: { 
    fontWeight: '900', 
    fontSize: 13, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },

  // --- Visual Gauge/Bar ---
  barContainer: { 
    height: 12, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 10, 
    justifyContent: 'center', 
    overflow: 'visible' 
  },
  gradientBar: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 10 
  },
  indicator: { 
    position: 'absolute', 
    width: 24, 
    height: 24, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    borderWidth: 5, 
    borderColor: '#0f172a', 
    marginLeft: -12, 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 3 
  },

  // --- History List Section ---
  historySection: { 
    marginTop: 10 
  },
  historyHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15, 
    paddingHorizontal: 5 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#0f172a' 
  },
  clearHistoryText: { 
    color: '#f87171', 
    fontWeight: '800', 
    fontSize: 14 
  },
  historyCard: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#f1f5f9', 
    elevation: 2 
  },
  historyIndicator: { 
    width: 6, 
    height: 40, 
    borderRadius: 3, 
    marginRight: 16 
  },
  historyContent: { 
    flex: 1 
  },
  historyBmi: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#1e293b' 
  },
  historyCategory: { 
    fontSize: 13, 
    color: '#64748b', 
    fontWeight: '600', 
    marginTop: 2 
  },
  historyRight: { 
    alignItems: 'flex-end' 
  },
  historyDate: { 
    fontSize: 12, 
    color: '#94a3b8', 
    fontWeight: '700', 
    marginBottom: 8 
  },
  deleteBtn: { 
    padding: 6, 
    backgroundColor: '#fff1f2', 
    borderRadius: 8 
  },
});