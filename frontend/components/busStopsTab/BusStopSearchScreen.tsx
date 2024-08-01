import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView, FlatList, View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { SearchBar, Icon } from "@rneui/base";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { NUSTag } from "@/components/busStopsTab/NUSTag";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Toast from "react-native-toast-message";
import { mapNUSCodeNametoFullName } from "@/utils/mapNUSCodeNametoFullName";

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

  const updateSearch = (search: string) => {
    setSearch(search);
    const newData = data.filter((item) => {
      const busStopName = item.busStopName ? item.busStopName.toLowerCase() : "";
      const fullBusStopName = busStopName.startsWith("nusstop_") ? mapNUSCodeNametoFullName(item.busStopName).toLowerCase() : "";
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
      const fullBusStopName = busStopName.startsWith("nusstop_") ? mapNUSCodeNametoFullName(item.busStopName).toLowerCase() : "";
      const busStopId = item.busStopId ? item.busStopId.toString() : "";
      return busStopName.includes(search.toLowerCase()) || busStopId.includes(search.toLowerCase()) || fullBusStopName.includes(search.toLowerCase());
    });

    setFilteredData(newFilteredData);

    // Update AsyncStorage
    try {
      await AsyncStorage.setItem("busStops", JSON.stringify(updatedData));
    } catch (error) {
      console.error("Error saving to AsyncStorage:", error);
      setUpdateAsyncStorageErrorMsg(`Failed to update AsyncStorage: ${error}`);
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
    const busStopName = mapNUSCodeNametoFullName(item.busStopName);

    return (
      <View style={styles.item}>
        <Text style={styles.busStopText}>{isNUSStop ? busStopName : busStopName + " " + "(" + item.busStopId + ")"}</Text>
        <View style={styles.iconContainer}>
          {isNUSStop && <NUSTag />}
          <Pressable onPress={() => toggleFavourite(item.busStopId)} accessibilityLabel={`toggle-favourite-${item.busStopId}`}>
            <Icon name={item.isFavourited ? "star" : "star-outline"} type="ionicon" color={item.isFavourited ? "#FFD700" : "#000"} style={{ marginLeft: 5 }} />
          </Pressable>
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
          <Ionicons name="arrow-back" color="848484" size={25} />
        </Pressable>
        <SearchBar placeholder="Search" platform="ios" onChangeText={(text) => updateSearch(text)} value={search} searchIcon={{ name: "search" }} clearIcon={{ name: "close-circle" }} autoFocus={true} style={{height: 15}} ref={(ref: any) => setSearchBarRef(ref)} />
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
    alignSelf: "flex-start",
    marginHorizontal: 10,
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
