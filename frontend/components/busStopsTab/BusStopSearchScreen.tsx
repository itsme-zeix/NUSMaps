import React, { useEffect, useState } from "react";
import { SafeAreaView, FlatList, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SearchBar, Icon } from "@rneui/base";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { NUSTag } from "@/components/busStopsTab/NUSTag";

const ITEMS_PER_PAGE = 20; // Number of items to load per page

const mapNUSCodeNameToFullName = [
  { value: "All", label: "All" },
  { value: "COM3", label: "COM 3" },
  { value: "TCOMS-OPP", label: "Opp TCOMS" },
  { value: "PGP", label: "Prince George's Park" },
  { value: "KR-MRT", label: "Kent Ridge MRT" },
  { value: "LT27", label: "LT 27" },
  { value: "UHALL", label: "University Hall" },
  { value: "UHC-OPP", label: "Opp University Health Centre" },
  { value: "MUSEUM", label: "Museum" },
  { value: "UTOWN", label: "University Town" },
  { value: "UHC", label: "University Health Centre" },
  { value: "UHALL-OPP", label: "Opp University Hall" },
  { value: "S17", label: "S17" },
  { value: "KR-MRT-OPP", label: "Opp Kent Ridge MRT" },
  { value: "PGPR", label: "Prince George's Park Foyer" },
  { value: "TCOMS", label: "TCOMS" },
  { value: "HSSML-OPP", label: "Opp HSSML" },
  { value: "NUSS-OPP", label: "Opp NUSS" },
  { value: "LT13-OPP", label: "Ventus" },
  { value: "IT", label: "Information Technology" },
  { value: "YIH-OPP", label: "Opp Yusof Ishak House" },
  { value: "YIH", label: "Yusof Ishak House" },
  { value: "CLB", label: "Central Library" },
  { value: "LT13", label: "LT13" },
  { value: "AS5", label: "AS5" },
  { value: "BIZ2", label: "BIZ 2" },
  { value: "KRB", label: "Kent Ridge Bus Terminal" },
  { value: "SDE3-OPP", label: "Opp SDE 3" },
  { value: "JP-SCH-16151", label: "The Japanese Primary School" },
  { value: "KV", label: "Kent Vale" },
  { value: "OTH", label: "Oei Tiong Ham Building" },
  { value: "BG-MRT", label: "Botanic Gardens MRT (PUDO)" },
  { value: "CG", label: "College Green" },
  { value: "RAFFLES", label: "Raffles Hall" },
];

const BusStopSearchScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { initialQuery } = route.params;
  const [search, setSearch] = useState(initialQuery);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [page, setPage] = useState(1); // Current page
  const [loading, setLoading] = useState(false);
  const [searchBarRef, setSearchBarRef] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("busStops");
        let parsedData = storedData ? JSON.parse(storedData) : [];
        parsedData = mapBusStopNames(parsedData);
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

  useFocusEffect(
    React.useCallback(() => {
      if (searchBarRef) {
        searchBarRef.focus();
      }
    }, [searchBarRef])
  );

  const updateSearch = (search: string) => {
    setSearch(search);
    const newData = data.filter((item) => item.busStopName.toLowerCase().includes(search.toLowerCase()));
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
    const updatedData = data.map((item) => (item.busStopId === busStopId ? { ...item, isFavourited: !item.isFavourited } : item));

    setData(updatedData);

    const newFilteredData = updatedData.filter((item) => item.busStopName.toLowerCase().includes(search.toLowerCase()));

    setFilteredData(newFilteredData.slice(0, page * ITEMS_PER_PAGE));

    // Update AsyncStorage
    await AsyncStorage.setItem("busStops", JSON.stringify(updatedData));
  };

  const mapBusStopNames = (busStops) => {
    return busStops.map((stop) => {
      let isNUSStop = false;
      if (stop.busStopName.startsWith("NUSSTOP_")) {
        isNUSStop = true;
        const code = stop.busStopName.replace("NUSSTOP_", "");
        const fullNameEntry = mapNUSCodeNameToFullName.find((entry) => entry.value === code);
        return {
          ...stop,
          busStopName: fullNameEntry ? fullNameEntry.label : stop.busStopName,
          isNUSStop,
        };
      }
      return { ...stop, isNUSStop };
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.busStopText}>{item.busStopName}</Text>
      <View style={styles.iconContainer}>
        {item.isNUSStop && <NUSTag/>}
        <TouchableOpacity onPress={() => toggleFavourite(item.busStopId)}>
          <Icon name={item.isFavourited ? "star" : "star-outline"} type="ionicon" color={item.isFavourited ? "#FFD700" : "#000"} style={{ marginLeft: 5 }}  />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text>Close</Text>
        </TouchableOpacity>
        <SearchBar placeholder="Search" onChangeText={(text) => updateSearch(text)} value={search} platform="ios" searchIcon={<Ionicons name="search" size={20} color="gray" />} clearIcon={<Ionicons name="close-circle" size={23} color="gray" />} autoFocus={true} ref={(ref) => setSearchBarRef(ref)} />
        <FlatList data={filteredData} keyExtractor={(item) => item.busStopId} renderItem={renderItem} onEndReached={loadMoreData} onEndReachedThreshold={0.5} ListFooterComponent={loading ? <ActivityIndicator size="large" /> : null} />
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
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  busStopText: {
    fontSize: 17,
  },
});

export default BusStopSearchScreen;
