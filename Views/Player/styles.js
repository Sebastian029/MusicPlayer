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
});
export default styles;
