import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
} from "react-native";
import BusStopSearchBar from "@/components/BusStopSearchBar";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface BusStop {
  busStopName: string;
  distanceAway: string;
  details: string[][];
}

const changiAirport: BusStop = {
  busStopName: "Changi Airport",
  distanceAway: "~200m away",
  details: [
    ["name", "time1", "time2"],
    ["name", "time1", "time2"],
  ],
};

const tanahMerahMRT: BusStop = {
  busStopName: "Tanah Merah MRT",
  distanceAway: "~500m away",
  details: [
    ["name", "time1", "time2"],
    ["name", "time1", "time2"],
  ],
};

const busStops: BusStop[] = [changiAirport, tanahMerahMRT];

export const CollapsibleContainer = ({
  children,
  expanded,
}: {
  children: React.ReactNode;
  expanded: boolean;
}) => {
  const [height, setHeight] = useState(0);
  const animatedHeight = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const onLayoutHeight = event.nativeEvent.layout.height;

    if (onLayoutHeight > 0 && height !== onLayoutHeight) {
      setHeight(onLayoutHeight);
    }
  };

  const collapsibleStyle = useAnimatedStyle(() => {
    animatedHeight.value = withTiming(expanded ? height : 0);

    return {
      height: animatedHeight.value,
    };
  }, [expanded]);

  return (
    <Animated.View style={[collapsibleStyle, { overflow: "hidden" }]}>
      <View style={{ position: "absolute" }} onLayout={onLayout}>
        {children}
      </View>
    </Animated.View>
  );
};

export const ColouredCircle = ({
  color,
  size = 50,
}: {
  color: string;
  size?: number;
}) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        justifyContent: "center",
        alignItems: "center",
      }}
    />
  );
};

export const ListItem = ({ item }: { item: any }) => {
  //Used to render details for 1 bus stop
  const [expanded, setExpanded] = useState(false);

  const onItemPress = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.wrap}>
      <TouchableWithoutFeedback onPress={onItemPress}>
        <View style={styles.container}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>{item.busStopName}</Text>
            <Text style={styles.text}>{item.distanceAway}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <CollapsibleContainer expanded={expanded}>
        <View style={styles.textContainer}>
          {item.details.map((detail: string[], index: number) => (
            <View key={index} style={styles.detailRow}>
              <View style={styles.leftContainer}>
                {/* TODO: use conditional to assign colour to circle based on busStopName/tag */}
                {/* Can consider moving this logic into the BusStop interface */}
                <ColouredCircle color="blue" size={15} />
                <Text style={[styles.details, styles.text]}>{detail[0]}</Text>
              </View>
              <View style={styles.rightContainer}>
                <Text style={[styles.details, styles.text]}>{detail[1]}</Text>
                <Text style={[styles.details, styles.text]}>{detail[2]}</Text>
              </View>
            </View>
          ))}
        </View>
      </CollapsibleContainer>
    </View>
  );
};

export default function BusStopsScreen() {
  return (
    <SafeAreaView>
      <BusStopSearchBar></BusStopSearchBar>
      {busStops.map((busStop, index) => (
        <ListItem key={index} item={busStop} />
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderColor: "#ccc",
    borderWidth: 1,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
  },
  container: { flexDirection: "row" },
  image: { width: 50, height: 50, margin: 10, borderRadius: 5 },
  textContainer: {
    justifyContent: "space-between",
  },
  details: { margin: 10 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  text: { opacity: 0.7 },
});
