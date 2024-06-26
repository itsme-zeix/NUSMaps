import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";

interface busNumberType {
    busNumber:string
};

const BUSICON = require("../../assets/images/bus_icon.png");
export const BusNumberCard: React.FC<busNumberType> = ({busNumber}) => {
    //no need to use state as busNumber won't be changed
    return (
        <View style = {styles.busNumberContainer}>
            <Image source = {BUSICON}></Image>
            <Text style = {styles.busNumber}>{busNumber}</Text>
        </View>
    )
};

const styles = StyleSheet.create({
    busNumberContainer: {
        backgroundColor: '#BBC34A',
        paddingHorizontal: 5,
        paddingVertical:5,
        borderRadius:5,
        marginBottom: 5,
        borderColor : "black",
        flexDirection:"row"
    },
    busNumber: {
        color: "black",
        fontSize:13
    },
})