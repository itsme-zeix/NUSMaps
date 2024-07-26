import { useState, useEffect } from "react";
import { StyleSheet, LayoutChangeEvent, View } from "react-native";
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";

const CollapsibleContainer = ({ children, expanded }: { children: React.ReactNode; expanded: boolean }) => {
  const [height, setHeight] = useState(0);
  const animatedHeight = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const onLayoutHeight = event.nativeEvent.layout.height;

    if (onLayoutHeight > 0 && height !== onLayoutHeight) {
      setHeight(onLayoutHeight);
    }
  };

  useEffect(() => {
    animatedHeight.value = withTiming(expanded ? height : 0);
  }, [expanded, height]);

  const collapsibleStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
    };
  });

  return (
    <Animated.View style={[collapsibleStyle, { overflow: "hidden" }]}>
      <View style={{ position: "absolute" }} onLayout={onLayout}>
        <View
          style={{
            borderBottomColor: "#626262",
            borderBottomWidth: StyleSheet.hairlineWidth,
            marginHorizontal: 16,
          }}
        />
        {children}
      </View>
    </Animated.View>
  );
};

export default CollapsibleContainer;
