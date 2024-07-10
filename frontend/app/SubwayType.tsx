import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";

interface MRTServiceType {
    serviceType:string
};

const SUBWAYICON = require("@/assets/images/subway-icon.png");

const determineBG = (input:string) => {
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

export const SubwayTypeCard: React.FC<MRTServiceType> = ({serviceType}) => {
    //no need to use state as busNumber won't be changed
    return (
        <View style = {[styles.MRTNumberContainer, {backgroundColor: determineBG(serviceType)}]}>
            <Image source = {SUBWAYICON} ></Image>
            <Text style = {styles.MRTNumber}>{serviceType}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    MRTNumberContainer: {
        paddingHorizontal: 10,
        borderRadius:5,
        borderColor : "black",
        flexDirection: "row",
        paddingVertical:5,
        marginBottom:5
    },
    MRTNumber: {
        color: "black",
        fontSize:13
    },
});