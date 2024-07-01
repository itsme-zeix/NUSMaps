import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";

interface busNumberType {
    busNumber:string
    busType:string
};

const BUSICON = require("../assets/images/bus-icon.png");
export const BusNumberCard: React.FC<busNumberType> = ({busNumber, busType}) => {
    //no need to use state as busNumber won't be changed
    console.log('bustype: ', busType);
    let busBackgroundColor = busType === "NUS_BUS" ? busBGMapping[busNumber] : styles.PUBLICBUSBG;
    console.log("busBackgroundcolor: ", busBackgroundColor);
    return (
        <View style = {[styles.busNumberContainer, busBackgroundColor]}>
            <Image source = {BUSICON}></Image>
            <Text style = {styles.busNumber}>{busNumber}</Text>
        </View>
    )
};

const styles = StyleSheet.create({
    busNumberContainer: {
        paddingHorizontal: 5,
        backgroundColor: '#BBC34A',
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
    PUBLICBUSBG: {
        backgroundColor: '#BBC34A',
    },
    D1: {
        backgroundColor: 'pink'
    },
    D2: {
        backgroundColor: 'purple'
    },
    A1: {
        backgroundColor: 'red'
    },
    A2: {
        backgroundColor: 'yellow'
    },
    BTC: {
        backgroundColor: 'orange'
    },
    K : {
        backgroundColor: 'blue'
    },
    L : {
        backgroundColor: 'grey'
    }
})
const busBGMapping = {
    A1: styles.A1,
    A2: styles.A2,
    D1: styles.D1,
    D2: styles.D2,
    BTC: styles.BTC,
    K: styles.K,
    L: styles.L
};