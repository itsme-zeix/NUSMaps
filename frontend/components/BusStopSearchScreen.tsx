// src/app/busStopScreens/BusStopsSearchResultsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SearchBar, Icon } from "@rneui/base";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";

const ITEMS_PER_PAGE = 20; // Number of items to load per page

const BusStopSearchScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { initialQuery } = route.params;
  const [search, setSearch] = useState(initialQuery);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [page, setPage] = useState(1); // Current page
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("busStops");
        let parsedData = storedData ? JSON.parse(storedData) : [];
        setData(parsedData);
        setFilteredData(parsedData.slice(0, ITEMS_PER_PAGE)); // Load the first page
      } catch (error) {
        console.error("Error fetching data from AsyncStorage:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    updateSearch(initialQuery);
  }, [initialQuery]);

  const updateSearch = (search) => {
    setSearch(search);
    const newData = data.filter((item) =>
      item.busStopName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredData(newData.slice(0, ITEMS_PER_PAGE)); // Reset to the first page of results
    setPage(1); // Reset the page to 1
  };

  const loadMoreData = () => {
    if (loading) return;

    setLoading(true);
    const nextPage = page + 1;
    const start = nextPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const moreData = data.slice(start, end);

    if (moreData.length > 0) {
      setFilteredData([...filteredData, ...moreData]);
      setPage(nextPage);
    }
    setLoading(false);
  };

  const toggleFavourite = async (busStopId) => {
    const updatedData = data.map((item) =>
      item.busStopId === busStopId
        ? { ...item, isFavourited: !item.isFavourited }
        : item
    );

    setData(updatedData);

    const newFilteredData = updatedData.filter((item) =>
      item.busStopName.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredData(newFilteredData.slice(0, page * ITEMS_PER_PAGE));

    // Update AsyncStorage
    await AsyncStorage.setItem("busStops", JSON.stringify(updatedData));
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.busStopText}>{item.busStopName}</Text>
      <TouchableOpacity onPress={() => toggleFavourite(item.busStopId)}>
        <Icon
          name={item.isFavourited ? "star" : "star-outline"}
          type="ionicon"
          color={item.isFavourited ? "#FFD700" : "#000"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text>Close</Text>
        </TouchableOpacity>
        <SearchBar
          placeholder="Search"
          onChangeText={updateSearch}
          value={search}
          platform="ios"
          searchIcon
        />
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.busStopId}
          renderItem={renderItem}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? <ActivityIndicator size="large" /> : null
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  busStopText: {
    fontSize: 17,
  },
});

export default BusStopSearchScreen;
