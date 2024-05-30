import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

export default function BusStopSearchBar() {
  const [Query, setQuery] = useState('');
//   return (
//     <View>
//       <TextInput
//         style={{height: 40, color : 'blue', backgroundColor:'red', paddingLeft: 50}}
//         placeholder="Search here"
//         onChangeText={newText => {
//           setQuery(newText);
//           console.log(newText);}}
//         defaultValue = {Query}
//         />
//     </View>

// )


  const handlePress = () => {
    console.log("Search bar pressed (to expand)");
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? "rgb(210, 230, 255)" : "white",
        },
        styles.wrapperCustom,
      ]}
      >
      {/* {({ pressed }) => (
        <Text style={styles.text}>{pressed ? "Pressed!" : "Press Me"}</Text>
      )} */}
      <TextInput
        placeholder="Press me"
        onChangeText={newText => {
          setQuery(newText);
          console.log(newText);
        }}
        defaultValue={Query}
        />
        
    </Pressable>
    );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: "#828282",
  },
  wrapperCustom: {
    borderRadius: 12,
    padding: 13,
    margin: 16,
    textAlign: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#828282",
  },
  });
