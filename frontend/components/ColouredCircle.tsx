import { View } from "react-native";

const ColouredCircle = ({ color, size = 15 }: { color: string; size?: number }) => {
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

export default ColouredCircle;
