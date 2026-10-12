import React from "react";
import { Modal, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/ThemeContext";

const MODAL_PADDING = 20;

export default function ModalScreen({ onClose, children }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top + MODAL_PADDING,
            paddingBottom: insets.bottom + MODAL_PADDING,
          },
        ]}
      >
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: MODAL_PADDING },
});
