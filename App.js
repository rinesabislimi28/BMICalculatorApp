import { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Keyboard,
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Animated, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/* Helper Functions */
// Function to get BMI category based on value
const getBMICategory = (bmi) => {
  const bmiValue = parseFloat(bmi);
  if (bmiValue < 18.5) return 'Underweight';
  if (bmiValue < 25) return 'Normal Weight';
  if (bmiValue < 30) return 'Overweight';
  return 'Obese';
};

// Function to get color associated with BMI category
const getBMIColor = (bmi) => {
  const bmiValue = parseFloat(bmi);
  if (bmiValue < 18.5) return '#74b9ff'; // Blue for underweight
  if (bmiValue < 25) return '#55efc4';   // Green for normal
  if (bmiValue < 30) return '#fdcb6e';   // Yellow for overweight
  return '#ff7675';                      // Red for obese
};


export default function App() {
  const [height, setHeight] = useState(''); 
  const [weight, setWeight] = useState(''); 
  const [bmi, setBmi] = useState('');      

  /* Animated Values */
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  /* Function to Calculate BMI */
  const calculateBMI = () => {
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);

    // Input validation
    if (!height || !weight) {
      alert("Please write height and weight!");
      return;
    }
    if (height <= 0 || weight <= 0) {
      alert("Please write positive value");
      return;
    }

    // BMI calculation
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    setBmi(bmiValue.toFixed(1));

    // Reset animations before starting
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);

    // Animate result container
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /* Function to Clear Inputs */
  const clearInputs = () => {
    setHeight('');
    setWeight('');
    setBmi('');
  };

  /* Render */
  return (
    <LinearGradient
      colors={['#4d71f3ff', '#eae0fbff', '#ffffffff']} 
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback
          onPress={Platform.OS !== 'web' ? Keyboard.dismiss : undefined}
        >
          <View style={styles.container}>

            {/* App Title */}
            <Text style={styles.title}>BMI Calculator</Text>

            {/* INPUTS */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Height (cm):</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder='e.g. 170'
                placeholderTextColor="#a3afc0ff"
                keyboardType='numeric'
                maxLength={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weight (kg):</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder='e.g. 65'
                placeholderTextColor="#A0AEC0"
                keyboardType='numeric'
                maxLength={3}
              />
            </View>

            {/* BUTTONS */}
            <View style={styles.buttonsRow}>

              {/* Calculate BMI Button */}
              <TouchableOpacity
                style={styles.buttonWrapper}
                onPress={calculateBMI}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#284ef9ff', '#6c3a9eff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Calculate BMI</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Clear Button */}
              <TouchableOpacity
                style={styles.clearButtonWrapper}
                onPress={clearInputs}
                activeOpacity={0.8}
              >
                <View style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* RESULT */}
            {bmi ? (
              <Animated.View
                style={[
                  styles.resultContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                    borderColor: getBMIColor(bmi),
                    backgroundColor: '#fff5f8ff', 
                  },
                ]}
              >
                {/* BMI value and label row */}
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Your BMI is:</Text>
                  <Text style={[styles.resultValue, { color: getBMIColor(bmi) }]}>{bmi}</Text>
                </View>

                {/* Category badge */}
                <View style={[styles.categoryBadge, { backgroundColor: getBMIColor(bmi) }]}>
                  <Text style={styles.categoryText}>{getBMICategory(bmi)}</Text>
                </View>

                {/* Suggestion text with emoji */}
                <Text style={[styles.suggestionText, { color: getBMIColor(bmi) }]}>
                  {bmi < 18.5
                    ? '😟 Underweight: Consider a balanced diet.'
                    : bmi < 25
                      ? '😊 Normal: Keep it up!'
                      : bmi < 30
                        ? '😬 Overweight: Try to exercise regularly.'
                        : '⚠️ Obese: Consult a doctor for guidance.'
                  }
                </Text>
              </Animated.View>
            ) : null}


            <StatusBar style="dark" />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 40,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  inputContainer: {
    width: '90%',
    marginBottom: 18,
  },
  label: {
    fontSize: 18,
    color: '#120953ff',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'left',
  },
  input: {
    width: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    color: '#111827',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  buttonWrapper: {
    flex: 1,
    marginRight: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    minWidth: 150,
  },
  button: {
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  clearButtonWrapper: {
    flex: 1,
    minWidth: 60,
  },
  clearButton: {
    backgroundColor: '#e2dce6ff',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000000ff',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  clearButtonText: {
    color: '#000000ff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 40,
    width: '80%',
    backgroundColor: '#fff5f8ff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  resultLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  resultValue: {
    fontSize: 35,
    fontWeight: 'bold',
  },
  categoryBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  categoryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    textAlign: 'center',
  },
});
