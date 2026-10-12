import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 10,
    marginTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addIcon: {
    fontSize: 34,
  },
  searchBox: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingBottom: 76,
  },
  sectionHeader: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  count: {
    fontSize: 12,
  },
  editIcon: {
    fontSize: 26,
    paddingLeft: 12,
  },
});
export default styles;
