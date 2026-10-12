import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 10,
    marginTop: 10,
  },
  centered: {
    alignItems: "center",
    marginTop: 40,
  },
  retry: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    borderWidth: 1.5,
  },
  filterIcon: {
    fontSize: 28,
    marginLeft: 10,
    marginBottom: 10,
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  selectedName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
  },
  selectedIcon: {
    fontSize: 26,
    paddingLeft: 12,
  },
  heart: {
    fontSize: 24,
    paddingLeft: 10,
  },
  errorText: {
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
  artist: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 76,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
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
