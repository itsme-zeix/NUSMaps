import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView, FlatList, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from "react-native";
import { SearchBar, Icon } from "@rneui/base";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { NUSTag } from "@/components/busStopsTab/NUSTag";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Toast from "react-native-toast-message";

type RootStackParamList = {
  BusStopSearch: { initialQuery: string };
};
type BusStopSearchRouteProp = RouteProp<RootStackParamList, "BusStopSearch">;
type BusStopSearchNavigationProp = StackNavigationProp<RootStackParamList, "BusStopSearch">;

interface BusStopItem {
  busStopId: string;
  busStopName: string;
  isFavourited: boolean;
}

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

const BusStopSearchScreen: React.FC = () => {
  const route = useRoute<BusStopSearchRouteProp>();
  const navigation = useNavigation<BusStopSearchNavigationProp>();
  const { initialQuery } = route.params;
  const [search, setSearch] = useState<string>(initialQuery);
  const [data, setData] = useState<BusStopItem[]>([]);
  const [filteredData, setFilteredData] = useState<BusStopItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchBarRef, setSearchBarRef] = useState<any>(null);
  const [updateAsyncStorageErrorMsg, setUpdateAsyncStorageErrorMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("busStops");
        let parsedData = storedData ? JSON.parse(storedData) : [];
        setData(parsedData);
        setFilteredData(parsedData);
      } catch (error) {
        console.error("Error fetching data from AsyncStorage:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    updateSearch(initialQuery);
  }, [initialQuery]);

  useFocusEffect(
    useCallback(() => {
      if (searchBarRef) {
        searchBarRef.focus();
      }
    }, [searchBarRef])
  );

  const mapBusStopNames = (busStopName: string) => {
    if (busStopName.startsWith("NUSSTOP_")) {
      const code = busStopName.replace("NUSSTOP_", "");
      const fullNameEntry = mapNUSCodeNameToFullName.find((entry) => entry.value === code);
      return fullNameEntry ? fullNameEntry.label : busStopName;
    }
    return busStopName;
  };

  const updateSearch = (search: string) => {
    setSearch(search);
    const newData = data.filter((item) => {
      const busStopName = item.busStopName ? item.busStopName.toLowerCase() : "";
      const fullBusStopName = busStopName.startsWith("nusstop_") ? mapBusStopNames(item.busStopName).toLowerCase() : "";
      const busStopId = item.busStopId ? item.busStopId.toString() : "";
      return busStopName.includes(search.toLowerCase()) || busStopId.includes(search.toLowerCase()) || fullBusStopName.includes(search.toLowerCase());
    });
    setFilteredData(newData);
  };

  const toggleFavourite = async (busStopId: string) => {
    const updatedData = data.map((item) => (item.busStopId === busStopId ? { ...item, isFavourited: !item.isFavourited } : item));

    setData(updatedData);

    const newFilteredData = updatedData.filter((item) => {
      const busStopName = item.busStopName ? item.busStopName.toLowerCase() : "";
      const fullBusStopName = busStopName.startsWith("nusstop_") ? mapBusStopNames(item.busStopName).toLowerCase() : "";
      const busStopId = item.busStopId ? item.busStopId.toString() : "";
      return busStopName.includes(search.toLowerCase()) || busStopId.includes(search.toLowerCase()) || fullBusStopName.includes(search.toLowerCase());
    });

    setFilteredData(newFilteredData);

    // Update AsyncStorage
    try {
      await AsyncStorage.setItem("busStops", JSON.stringify(updatedData));
    } catch (error) {
      console.error("Error saving to AsyncStorage:", error);
      setUpdateAsyncStorageErrorMsg(`Failed to update AsyncStorage, ${error}`);
    }
  };
  // Display toast is Async Storage was not updated
  useEffect(() => {
    if (updateAsyncStorageErrorMsg) {
      Toast.show({
        type: "error",
        text1: updateAsyncStorageErrorMsg,
        text2: "Please restart the application before trying again.",
        position: "top",
        autoHide: true,
      });
    }
  }, [updateAsyncStorageErrorMsg]);

  const renderItem = ({ item }: { item: BusStopItem }) => {
    const isNUSStop = item.busStopName.startsWith("NUSSTOP_");
    const busStopName = mapBusStopNames(item.busStopName);

    return (
      <View style={styles.item}>
        <Text style={styles.busStopText}>{isNUSStop ? busStopName : busStopName + " " + "(" + item.busStopId + ")"}</Text>
        <View style={styles.iconContainer}>
          {isNUSStop && <NUSTag />}
          <TouchableOpacity onPress={() => toggleFavourite(item.busStopId)} accessibilityLabel={`toggle-favourite-${item.busStopId}`}>
            <Icon name={item.isFavourited ? "star" : "star-outline"} type="ionicon" color={item.isFavourited ? "#FFD700" : "#000"} style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: 10 }}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text>Close</Text>
        </Pressable>
        <SearchBar placeholder="Search" onChangeText={(text) => updateSearch(text)} value={search} platform="ios" searchIcon={<Ionicons name="search" size={20} color="gray" />} clearIcon={<Ionicons name="close-circle" size={23} color="gray" style={{ opacity: 0 }} />} autoFocus={true} ref={(ref: any) => setSearchBarRef(ref)} />
        <FlatList data={filteredData} keyExtractor={(item) => item.busStopId} renderItem={renderItem} />
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
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
});

export default BusStopSearchScreen;
