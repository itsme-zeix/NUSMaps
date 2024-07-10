import React from "react";
import { View, StyleSheet, Text } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { determineFontColor } from "./determineFontColor";

interface MRTServiceType {
    serviceType: string;
}

const determineBG = (input: string) => {
    //input is based on routeId
    if (input === "NS") {
        return "red";
    } else if (input === "DT") {
        return "#338AFF";
    } else if (input === "EW" || input === "CG") {
        return "#33FF3C";
    } else if (input === "NE") {
        return "#8D33FF";
    } else if (input === "CC") {
        return "#FFF633";
    } else if (input === "TE") {
        return "#A53C03";
    } else {
        //error
        return "black";
    }
};

export const SubwayTypeCard: React.FC<MRTServiceType> = ({ serviceType }) => {
    const bgColor = determineBG(serviceType);
    const fontColor = determineFontColor(bgColor);

    return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="train" size={26} color="#434343" style={{ marginRight: 3 }} />
            <View style={[styles.MRTNumberContainer, { backgroundColor: bgColor }]}>
                <Text style={[styles.MRTNumber, { color: fontColor }]}>{serviceType}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    MRTNumberContainer: {
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderRadius: 10,
        marginBottom: 5,
        borderColor: "black",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    MRTNumber: {
        fontFamily: "Inter-Bold",
        fontSize: 15,
    },
});
