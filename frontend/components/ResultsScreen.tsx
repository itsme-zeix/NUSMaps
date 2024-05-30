import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
} from "react-native";
import { ImageSourcePropType } from "react-native";
import Modal from "react-native-modal";

interface Coords {
  latitude: number;
  longitude: number;
}

interface ResultObject {
  origin: Coords;
  destination: Coords;
  departureTiming: string;
  arrivalTiming: string;
  travelTime: string; // format of 1 hr 29 min
  types: string[]; //format of ['walk', 'train', 'walk']
}

interface IconCatalog {
  walk: ImageSourcePropType;
  train: ImageSourcePropType;
  bus: ImageSourcePropType;
  rchevron: ImageSourcePropType;
}

const iconList: IconCatalog = {
  walk: require("../assets/images/walk_icon.png"),
  train: require("../assets/images/subway_icon.png"),
  bus: require("../assets/images/bus_icon.png"),
  rchevron: require(`../assets/images/chevron_right_icon.png`),
};

const resultCard: React.FC<ResultObject> = ({
  departureTiming,
  arrivalTiming,
  travelTime,
  types,
}) => {
  types = types.flatMap((icon) => [icon, "rchevron"]);
  types.splice(types.length - 1, 1); // remove the last chevron
  console.log(types);
  return (
    <View style={styles.resultCard}>
      <View style={styles.icons}>
        {types.map((icon, index) => (
          <Image
            key={index}
            source={iconList[icon as keyof IconCatalog]}
            style={{ flexDirection: "row", alignItems: "center" }}
          />
        ))}
        <Text>
          {departureTiming} - {arrivalTiming}
        </Text>
      </View>
      <Text style={styles.travelTimings}>{travelTime}</Text>
    </View>
  );
};

const ResultScreen: React.FC<
  ResultObject & {
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;
  }
> = ({
  origin,
  destination,
  departureTiming,
  arrivalTiming,
  travelTime,
  types,
  isVisible,
  setIsVisible,
}) => {
  if (isVisible) {
    return (
      <SafeAreaView>
        <ScrollView style={{ flex: 1 }}>
          <Modal
            isVisible={isVisible}
            animationInTiming={200}
            onBackdropPress={() => setIsVisible(false)}
            onBackButtonPress={() => setIsVisible(false)}
            hideModalContentWhileAnimating={true}
            backdropColor="green"
            style={styles.resultContainer}
          >
            <View style={{ flex: 1, direction: "ltr", alignItems: "center" }}>
              {resultCard({
                origin,
                destination,
                departureTiming,
                arrivalTiming,
                travelTime,
                types,
              })}
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  } else {
    return;
  }
};

const styles = StyleSheet.create({
  resultContainer: {
    width: "100%",
    height: "100%",
    flex: 1,
    margin: 0,
    justifyContent: "flex-start",
  },
  resultCard: {
    //has two children, transport routes, and the timing on the end
    height: 80,
    width: "95%",
    borderBottomColor: "black",
    borderWidth: 1,
    justifyContent: "space-evenly",
    backgroundColor: "red",
  },
  icons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  travelTimings: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
export default ResultScreen;