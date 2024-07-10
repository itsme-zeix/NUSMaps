import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";

interface busNumberType {
    busNumber:string
    busType:string
}

const BUSICON = require("@/assets/images/bus-icon.png");
export const BusNumberCard: React.FC<busNumberType> = ({busNumber, busType}) => {
    //no need to use state as busNumber won't be changed
    let busBackgroundColor = busType === "NUS_BUS" ? busBGMapping[busNumber] : styles.PUBLICBUSBG;
    return (
        <View style = {[styles.busNumberContainer, busBackgroundColor]}>
            <Image source = {BUSICON}></Image>
            <Text style = {styles.busNumber}>{busNumber}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    busNumberContainer: {
        paddingHorizontal: 5,
        backgroundColor: '#BBC34A',
        paddingVertical:5,
        borderRadius:5,
        marginBottom: 5,
        borderColor : "black",
        flexDirection:"row",
        justifyContent: "center",
        alignItems: "center"
    },
    busNumber: {
        color: "black",
        fontSize:13
    },
    PUBLICBUSBG: {
        backgroundColor: 'green',
    },
    D1: {
        backgroundColor: '#CD82E2'
    },
    D2: {
        backgroundColor: '#6F1B6F'
    },
    A1: {
        backgroundColor: '#FF0000'
    },
    A2: {
        backgroundColor: '#E4CE0C'
    },
    BTC: {
        backgroundColor: '#EE8136'
    },
    K : {
        backgroundColor: '#345A9B'
    },
    L : {
        backgroundColor: '#BFBFBF'
    }
});

const busBGMapping = {
    A1: styles.A1,
    A2: styles.A2,
    D1: styles.D1,
    D2: styles.D2,
    BTC: styles.BTC,
    K: styles.K,
    L: styles.L
};