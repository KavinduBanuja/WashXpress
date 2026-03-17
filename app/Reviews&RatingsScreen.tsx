import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Image
} from "react-native";
import { Header } from "../components/Header";
import * as ImagePicker from "expo-image-picker";

export default function WriteReviewScreen() {

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [mood, setMood] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  function animateStar() {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true
      })
    ]).start();
  }

  function handleRating(i: number) {
    setRating(i);
    animateStar();
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

  function handleSubmit() {
    console.log({ rating, review, mood, image });
  }

  return (
    <View style={styles.container}>

      <Header title="WashXpress Review" />

      <View style={styles.content}>

        {/* Title */}
        <Text style={styles.title}>
          How was your wash?
        </Text>

        {/* Mood Selection */}
        <View style={styles.moodRow}>
          {["😡", "😐", "😍"].map((m) => (
            <TouchableOpacity key={m} onPress={() => setMood(m)}>
              <Text style={[
                styles.mood,
                mood === m && styles.moodActive
              ]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stars */}
        <View style={styles.starRow}>
          {[1,2,3,4,5].map((i) => (
            <TouchableOpacity key={i} onPress={() => handleRating(i)}>
              <Animated.Text style={[
                styles.star,
                i <= rating && styles.starActive,
                { transform: [{ scale: scaleAnim }] }
              ]}>
                {i <= rating ? "⭐" : "☆"}
              </Animated.Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <TextInput
          style={styles.input}
          placeholder="Tell us about your experience..."
          multiline
          value={review}
          onChangeText={setReview}
        />

        {/* Image Upload */}
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} />
          ) : (
            <Text style={styles.uploadText}>
              + Upload Car Photo
            </Text>
          )}
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (rating === 0 || review === "") && { opacity: 0.5 }
          ]}
          disabled={rating === 0 || review === ""}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>
            Submit Review
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },

  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center"
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20
  },

  moodRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25
  },

  mood: {
    fontSize: 30,
    marginHorizontal: 10,
    opacity: 0.5
  },

  moodActive: {
    opacity: 1,
    transform: [{ scale: 1.2 }]
  },

  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25
  },

  star: {
    fontSize: 34,
    marginHorizontal: 5,
    color: "#94a3b8"
  },

  starActive: {
    color: "#facc15"
  },

  input: {
    height: 120,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#fff",
    textAlignVertical: "top"
  },

  imageBox: {
    height: 120,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbd5f5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    overflow: "hidden"
  },

  uploadText: {
    color: "#64748b"
  },

  preview: {
    width: "100%",
    height: "100%"
  },

  submitBtn: {
    backgroundColor: "#0ea5e9",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  }

});