import React from "react";
import { View, Text } from "react-native";

import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
interface ServiceCardProps {
    busService:string,
    busStops:string[], // the stops shown in the detailed screen
    displayedStops:string[] // the stops that are shown in the card
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ busService, busStops, displayedStops }) => {    //it will pass a json with the service and the bus stop
    // add pressable
    let stops = displayedStops.flatMap((stop:string) => [stop, "rightArrow"]);
    stops.pop(); //removes the last arrow 
    return (
    <View style={{flexDirection:"row"}}>
        <MaterialCommunityIcons name="bus-clock" size={24} color="black" />
        <View style = {{flexDirection:"column"}}>
            <Text style= {{fontWeight:"bold"}}>{busService}</Text>
            <View style = {{flexDirection:"row"}}>
                {stops.map((stop, index) => {
                    if (stop == "rightArrow") {
                        return (<AntDesign key = {index} name="arrowright" size={24} color="black" />);
                    } else {
                        return (<Text key = {index}>{stop}</Text>);
                    }
                })}
            </View>
        </View>
    </View>
    );
};  