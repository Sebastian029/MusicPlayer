import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  waveContainer: {
    backgroundColor: "transparent",
    justifyContent: "center",
    flex: 1,
  },
  coverFrame: {
    borderRadius: 25,
    borderWidth: 1,
    overflow: "hidden",
  },
  topText: { fontSize: 20, fontFamily: "Helvetica" },
  songTitle: {
    fontSize: 22,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  textBlock: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  artist: {
    fontSize: 16,
  },
  playedPart: {
    position: "absolute",
    zIndex: 1,
    left: 0,
    bottom: 0,
    top: 0,
  },
  waveArea: {
    height: 120,
  },
  timeText: {
    fontSize: 15,
    fontFamily: "Helvetica",
    letterSpacing: 1.3,
    paddingHorizontal: 20,
  },

  mainContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  coverImage: {
    width: 260,
    height: 260,
    borderRadius: 25,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  icon: {
    fontSize: 30,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconLarge: {
    fontSize: 70,
  },
});
export default styles;
