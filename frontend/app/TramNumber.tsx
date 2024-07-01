import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";

interface TramServiceType {
    serviceType:string
};

const TRAMICON = require("../assets/images/tram-icon.png");

export const TramTypeCard: React.FC<TramServiceType> = ({serviceType}) => {
    //no need to use state as busNumber won't be changed
    return (
        <View style = {styles.LRTNumberContainer}>
            <Image source = {TRAMICON} ></Image>
            <Text style = {styles.LRTNumber}>{serviceType}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    LRTNumberContainer: {
        paddingHorizontal: 10,
        borderRadius:5,
        borderColor : "black",
        flexDirection: "row",
        paddingVertical:5,
        marginBottom:5,
        backgroundColor:"grey"
    },
    LRTNumber: {
        color: "black",
        fontSize:13
    },
});