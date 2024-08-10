import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";
import { determineFontColor } from "./determineFontColor";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface TramServiceType {
    serviceType:string
};

// const TRAMICON = require("@/assets/images/tram-icon.png");

export const TramTypeCard: React.FC<TramServiceType & {testID:string}> = ({serviceType, testID}) => {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }} testID={testID}>
            <MaterialIcons name="tram" size={20} color="#434343" style={{ marginRight: 3 }} />
            <View style = {styles.LRTNumberContainer}>
                <Text style = {styles.LRTNumber}>{serviceType}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    LRTNumberContainer: {
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderRadius: 10,
        borderColor: "black",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#728473",
    },
    LRTNumber: {
        fontFamily: "Inter-SemiBold",
        fontSize: 15,
    },
});