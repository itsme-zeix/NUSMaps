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
        return "#E1241D";
    } else if (input === "DT") {
        return "#0056B8";
    } else if (input === "EW" || input === "CG") {
        return "#00953B";
    } else if (input === "NE") {
        return "#9E27B5";
    } else if (input === "CC") {
        return "#FF9E17";
    } else if (input === "TE") {
        return "#9D5A18";
    } else {
        //error
        return "black";
    }
};

export const SubwayTypeCard: React.FC<MRTServiceType & {testID:string}> = ({ serviceType, testID }) => {
    const bgColor = determineBG(serviceType);
    const fontColor = determineFontColor(bgColor);

    return (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }} testID={testID}>
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
