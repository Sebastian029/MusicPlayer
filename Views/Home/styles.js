import { StyleSheet } from "react-native";
import { SearchBar } from "react-native-screens";

const styles = StyleSheet.create({
  container: {
    margin: 10,
    height: "110%",
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
  searchBar: {
    flexDirection: "column",
    justifyContent: "center",
    paddingTop: 5,
    paddingHorizontal: 2,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
});
export default styles;
