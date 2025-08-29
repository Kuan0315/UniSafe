import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

type AppHeaderProps = {
  title?: string;
};

export default function AppHeader({ title }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>UniSafe</Text>
      </View>
      {title ? (
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      ) : null}
    </View>
  );
}

const BLUE = "#1E88E5";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
    justifyContent: "flex-start",
    gap: 8,
  },
  logo: {
    width: 24,
    height: 24,
  },
  appName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  titleBar: {
    backgroundColor: BLUE,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});


