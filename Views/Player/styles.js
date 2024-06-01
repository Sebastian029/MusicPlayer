import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    margin: 10,
    height: "80%",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  itemContainer: {
    flexDirection: "row",
    marginVertical: 10,
    alignItems: "center",
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  name: {
    fontSize: 14,
    color: "gray",
  },
  waveContainer: {
    backgroundColor: "transparent",
    justifyContent: "center",
    flex: 1,
  },
  shadowContainer: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  topText: { fontSize: 20, fontFamily: "Helvetica" },
  songTitle: {
    fontSize: 25,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    letterSpacing: 1.3,
  },
  timeText: {
    fontSize: 15,
    fontFamily: "Helvetica",
    letterSpacing: 1.3,
    paddingHorizontal: 20,
  },

  mainContainer: {
    flexDirection: "column",
    alignItems: "center",
    height: "50%",
    gap: 20,
  },
  coverImage: {
    width: 300,
    height: 300,
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
  iconLarge: {
    fontSize: 70,
  },
});
export default styles;
