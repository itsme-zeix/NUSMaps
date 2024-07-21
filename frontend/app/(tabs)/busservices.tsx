import React, {useEffect, useState} from "react";
import { StyleSheet, View, Text, Pressable} from "react-native";
import MapView, {
  Marker,
  LatLng,
  PROVIDER_GOOGLE,
  Polyline,
} from "react-native-maps";
import axios from "axios";
// import BusStopFilterDropDownMenu from "@/components/busServicesLive/busStopsOptions";
import { ServiceCard } from "@/components/busServicesLive/busServiceCard";
import CustomMarker from "@/components/busServicesLive/busStopMarker";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ActiveBusMarker from "@/components/busServicesLive/activeBusMarker";
const polyline = require("@mapbox/polyline");

const NUS_SHUTTLE_ROUTES = {
  //LT13-OPP is ventus
  "A1" : [
      "KRB",
      "LT13",
      "AS5",
      "BIZ2",
      "TCOMS-OPP",
      "PGP",
      "KR-MRT",
      "LT27",
      "UHALL",
      "UHC-OPP",
      "YIH",
      "CLB",
      "KRB",
    ], // will always start and end in the same station, only count sequentially
    "A2": [
      "KRB",
      "IT",
      "YIH-OPP",
      "MUSEUM",
      "UHC",
      "UHALL-OPP",
      "S17",
      "KR-MRT-OPP",
      "PGPR",
      "TCOMS",
      "HSSML-OPP",
      "NUSS-OPP",
      "LT13-OPP",
      "KRB",
    ],
    "BTC": [
      "OTH",
      "BG-MRT",
      "KR-MRT",
      "LT27",
      "UHALL",
      "UHC-OPP",
      "UTOWN",
      "RAFFLES",
      "KV",
      "MUSEUM",
      "YIH",
      "CLB",
      "LT13",
      "AS5",
      "BIZ2",
      "PGP",
      "CG",
      "OTH",
    ],
   "D1": [
      "COM3",
      "HSSML-OPP",
      "NUSS-OPP",
      "LT13-OPP",
      "IT",
      "YIH-OPP",
      "MUSEUM",
      "UTOWN",
      "YIH",
      "CLB",
      "LT13",
      "AS5",
      "BIZ2",
      "COM3",
    ],
    "D2": [
      "COM3",
      "TCOMS-OPP",
      "PGP",
      "KR-MRT",
      "LT27",
      "UHALL",
      "UHC-OPP",
      "MUSEUM",
      "UTOWN",
      "UHC",
      "UHALL-OPP",
      "S17",
      "KR-MRT-OPP",
      "PGPR",
      "TCOMS",
      "COM3",
    ],
    "K": [
      "PGP",
      "KR-MRT",
      "LT27",
      "UHALL",
      "UHC-OPP",
      "YIH",
      "CLB",
      "SDE3-OPP",
      "JP-SCH-16151",
      "KV",
      "MUSEUM",
      "UHC",
      "UHALL-OPP",
      "S17",
      "KR-MRT-OPP",
      "PGPR",
    ],
    "L" : ["OTH", "BG-MRT", "CG", "OTH"],
  };

const busStopsWithBaseNames =
    //used for testing, migrate to postgres
    //used for display on the base cards for users to choose
    { "COM3" : "SOC",
      "PGP" : "PGP",
      "KR-MRT" : "KR MRT",
      "UTOWN" : "UT",
      "KR-MRT-OPP" : "Opp KR MRT",
      "IT": "IT",
      "CLB" : "CLB",
      "BIZ2": "BIZ",
      "KRB": "KRT",
      "KV" : "KV",
      "OTH": "BTC",
      "BG-MRT": "BG-MRT",
      "CG": "College Gr"
    };

const additionalMarkerNames = {
  //adds onto existing bus stops with base names list, will show the names for the stops (markers) on the map
  "JP-SCH-16151": "Jpn Pr Sch",
  "KV": "Kent Vale",
  "SDE3-OPP": "Opp SDE 3",
  "MUSEUM": "Museum",
  "YIH": "YIH",
  "UHC": "UHC",
  "UHC-OPP": "Opp UHC",
  "KRB": "KR Bus Ter",
  "LT13": "LT 13",
  "LT13-OPP": "Ventus",
  "AS5": "AS 5",
  "BIZ2": "BIZ 2",
  "TCOMS-OPP": "Opp TCOMS",
  "PGP": "Prince George's Park",
  "KR-MRT": "Kent Ridge MRT",
  "LT27":"LT 27", 
  "UHALL": "UHall",
  "CLB":"CLB",
  "S17": "S 17", 
  "PGPR": "PGP Foyer",
  "KR-MRT-OPP": "Opp KR MRT",
  "BG-MRT": "BG MRT",
  "OTH":"OTH",
};

const markerNames = {
  ...busStopsWithBaseNames,
  ...additionalMarkerNames
};

const busStopsWithDisplayNames = 
    //used to map the values of the route to the detailed naming shown to users when they click on the route
    {
      "COM3":"COM 3",
      "TCOMS-OPP": "Opp TCOMS",
      "PGP": "Prince George's Park",
      "KR-MRT": "Kent Ridge MRT",
      "LT27":"LT 27", 
      "UHALL": "University Hall",
      "UHC-OPP": "Opp University Health Centre",
      "MUSEUM": "Museum",
      "UTOWN": "University Town",
      "UHC": "University Health Centre",
      "UHALL-OPP": "Opp University Hall",
      "S17": "S 17", 
      "KR-MRT-OPP": "Opp Kent Ridge MRT",
      "PGPR": "Prince George's Park Foyer",
      "TCOMS": "TCOMS",
      "HSSML-OPP": "Opp HSSML",
      "NUSS-OPP": "Opp NUSS",
      "LT13-OPP": "Ventus",
      "IT": "IT",
      "YIH-OPP": "Opp Yusof Ishak House",
      "YIH": "Yusof Ishak House",
      "CLB": "Central Library",
      "LT13": "LT 13",
      "AS5": "AS 5",
      "BIZ2": "BIZ 2",
      "KRB": "Kent Ridge Bus Terminal",
      "SDE3-OPP": "Opp SDE 3",
      "JP-SCH-16151": "The Japanese Primary School",
      "KV": "Kent Vale",
      "OTH": "Oei Tiong Ham Building",
      "BG-MRT": "Botanic Gardens MRT (PUDO)",
      "CG": "College Green",
      "RAFFLES" : "Raffles Hall"
    };

function getMarkerName(busStopName:string) {
  const result = markerNames[busStopName];
  if (result == undefined) {
    return busStopsWithDisplayNames[busStopName];
  } 
  return result;
};

function fetchBaseCardData(busService:string) {
  const routeArray = NUS_SHUTTLE_ROUTES[busService];
  if (routeArray != undefined) {
    return routeArray.map((value) => {
      const displayNameOnCard = busStopsWithBaseNames[value];
      if (displayNameOnCard != undefined) return displayNameOnCard;
    }).filter(value => value != undefined);
  }
};
 
function fetchDetailedStopNames(busService:string) {
  const routeArray = NUS_SHUTTLE_ROUTES[busService];
  if (routeArray != undefined) {
    return routeArray.map((value) => {
      const displayNameDetailed = busStopsWithDisplayNames[value];
      if (displayNameDetailed != undefined) return displayNameDetailed
      else {
        console.log("problematic value:", value);
        console.log("name: ", displayNameDetailed);
      }
    });
  } else {
    console.log("bus service:", busService);
    return "undefined stop, please report this bug";
  }
};

const NUS_BUS_SERVICES = ["A1", "A2", "BTC", "D1", "D2", "K", "L"];

async function fetchBusRoute(serviceName:string) {
  //returns 5 things in 1 array, 
  //1. type string, for the polyline of the bus route
  //2. type string, for the various bus stops of the route
  //3. type json, which is the location of the bus(es) + their direction
  //4. type string, the polyline of the markers used to denote direction, (idk this one need to hardcode)
  //5. the direction of each marker (clockwise degrees) (hardcode)
  // 4 and 5 will be added later
  try {
    const serviceRouteData = await axios.post("https://nusmaps.onrender.com/busServicesLive", {
      service: serviceName,
      requestType: "fetchAll"
    });
    return serviceRouteData.data;
  } catch (error) {
    console.error("error fetching result from backend: ", error);
    return [];
  }
}



function _convertPolylineToCoordsArray(polylineString:string):number[][] {
  return polyline.decode(polylineString);
};

interface busStopType extends LatLng{
  name:string;
};

interface activeBusType extends LatLng {
  direction:number,
  crowdLevel:string,
  licensePlate:string
};
interface routeDataType {
  checkPointCoordsArray: LatLng[],
  busStopsCoordsArray: busStopType[],
  activeBusesArray: activeBusType[] //TENTATIVE TO CHANGE, update to interface[] type
};

export default function NUSBusServices() {
  //make it a live query, when u click on the route
  const [routeDataShown, setRouteDataShown] = useState({
    checkPointCoordsArray: [],
    busStopsCoordsArray: [],
    activeBusesArray: []
  });
  const [routeSelected, setRouteSelected] = useState("A1");
  const [activeBusData, setActiveBusData] = useState([]);

  const routeDataToBeShown = async () => {
    const routeData = await fetchBusRoute(routeSelected);
    const checkPointCoordsPolyline = routeData.checkPointPolylineString;
    const busStopsCoordsArray = routeData.busStopsCoordsArray;
    const activeBusesArray = routeData.processedActiveBuses;
    const checkPointCoords = _convertPolylineToCoordsArray(checkPointCoordsPolyline).map(coord => ({
      latitude: coord[0],
      longitude: coord[1]
    }));
    setRouteDataShown({
      checkPointCoordsArray: checkPointCoords,
      busStopsCoordsArray: busStopsCoordsArray,
      activeBusesArray: activeBusesArray
    });
    setActiveBusData(activeBusesArray);
  };

  async function fetchBusLocations() {
    try {
      const serviceRouteData = await axios.post("http://192.168.2.139:3000/busServicesLive", {
        service: routeSelected,
        requestType: "fetchActiveBus"
      });
      const activeBusesArray = serviceRouteData.data;
      setActiveBusData(activeBusesArray);
    } catch (error) {
      console.error("error fetching result from backend: ", error);
      setActiveBusData([]); // Ensure activeBusData is reset on error
    }
  }

  useEffect(() => {
    routeDataToBeShown();
  }, [routeSelected]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchBusLocations();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [routeSelected]);

  const NUS = {
    latitude: 1.2966,
    longitude: 103.7764,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
  const NUS_BTC = {
    latitude: 1.301243123663655, 
    longitude: 103.80083642680974,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  const BUKITTIMAHCAMPUS = {
    latitude:1.320833615554101, 
    longitude:103.81686475132896,
    latitudeDelta:0.01,
    longitudeDelta:0.01
  };
  const MARKERDIRECTIONS = {
    "A1": [{
      latitude: 1.29405,
      longitude: 103.76973,
      angle: '180deg'
    }, 
    {
      latitude:1.2955070908079434,
      longitude:103.77072841311227,
      angle:'155deg'
    },
    {
      latitude:1.2923086387008367, 
      longitude:103.77409145023913,
      angle: "20deg",
    },
    {
      latitude:1.2915679763491539, 
      longitude:103.78236276215415,
      angle: "16deg"
    },
    {
      latitude:1.2947475747743722, 
      longitude:103.78449302215324,
      angle:"290deg"
    },
    {
      latitude:1.2974016052916018, 
      longitude:103.78052888927002,
      angle:"230deg"
    },
    {
      latitude:1.2988500475970672, 
      longitude:103.77579967302323,
      angle:"220deg"
    },
    {
      latitude:1.2963940606392585, 
      longitude:103.7722840249133,
      angle:"180deg"
    }],
    "A2": [{
      latitude: 1.29405,
      longitude: 103.76973,
      angle: '180deg'
    }, 
    {
      latitude:1.2963631876080495,
      longitude:103.77124751255961,
      angle:'50deg'
    },
    {
      latitude:1.2989876333805548,
      longitude:103.7742470867903,
      angle:'340deg'
    },
    {
      latitude:1.3006151504062908,
      longitude:103.77405566429856,
      angle:'260deg'
    },
    {
      latitude:1.298888233298508,
      longitude:103.77597343837171,
      angle:'60deg'
    },
    {
      latitude:1.2974154593493992,
      longitude:103.7802721054462,
      angle:'60deg'
    }, 
    {
      latitude:1.29493,
      longitude:103.78456,
      angle:'100deg'
    },
    {
      latitude:1.29172907463164,
      longitude:103.78270417195186,
      angle:'180deg'
    },
    {
      latitude:1.29297,
      longitude:103.77849,
      angle:'220deg'
    },
    {
      latitude:1.29316,
      longitude:103.77511,
      angle:'160deg'
    },
    {
      latitude:1.29373,
      longitude:103.77110,
      angle:'220deg'
    },
    {
      latitude:1.2947863120276193,
      longitude:103.76987476485583,
      angle:'100deg'
    }
  ],
  "BTC": [{
    latitude:1.3197467341117723,
    longitude:103.81793699742364,
    angle:'280deg'
  }, 
  {
    latitude:1.3223929504175478,
    longitude:103.81914132017444,
    angle:'240deg'
  }, 
  {
    latitude:1.3215589231103715,
    longitude:103.81305866363331,
    angle:'180deg'
  }, 
  {
    latitude:1.3135724374987534,
    longitude:103.80445443936672,
    angle:'150deg'
  }, 

  {
    latitude:1.29252,
    longitude:1.29252,
    angle:'180deg'
  }, 
  {
    latitude:1.29207,
    longitude:103.78834,
    angle:'260deg'
  },
  {
    latitude:1.29736,
    longitude:103.78010,
    angle:'200deg'
  },
  {
    latitude:1.30072,
    longitude:103.77413,
    angle:'340deg'
  },
  {
    latitude:1.30361,
    longitude:103.77461,
    angle:'340deg'
  },
  {
    latitude:1.30078,
    longitude:103.77435,
    angle:'140deg'
  },
  {
    latitude:1.30099,
    longitude:103.77217,
    angle:'200deg'
  },
  {
    latitude:1.30206,
    longitude:103.76916,
    angle:'200deg'
  },
  {
    latitude:1.29646,
    longitude:103.77235,
    angle:'150deg'
  },
  {
    latitude:1.29362,
    longitude:103.77708,
    angle:'60deg'
  }, 
  {
    latitude:1.29094,
    longitude:103.78737,
    angle:'30deg'
  }, 
  {
    latitude:1.29055,
    longitude:103.79456,
    angle:'0deg'
  }, 
  {
    latitude:1.29602,
    longitude:103.79952,
    angle:'350deg'
  }, 
  {
    latitude:1.32061,
    longitude:103.81184,
    angle:'350deg'
  },
  {
    latitude:1.32322,
    longitude:103.81655,
    angle:'50deg'
  }],
  "D1": [{
    latitude:1.29423,
    longitude:103.77530,
    angle:'110deg'
  }, 
  {
    latitude:1.29272,
    longitude:103.77343,
    angle:'270deg'
  }, 
  {
    latitude:1.29632,
    longitude:103.77092,
    angle:'330deg'
  }, 
  {
    latitude:1.29952,
    longitude:103.77446,
    angle:'340deg'
  },
  {
    latitude:1.30079,
    longitude:103.77424,
    angle:'355deg'
  },
  {
    latitude:1.30223,
    longitude:103.77410,
    angle:'280deg' //maybe too close here
  },
  {
    latitude:1.30232,
    longitude:103.77406,
    angle:'100deg'
  },
  {
    latitude:1.29863,
    longitude:103.77410,
    angle:'180deg'
  },
  {
    latitude:1.29501,
    longitude:103.77057,
    angle:'140deg'
  }, 
  {
    latitude:1.29281,
    longitude:103.77492,
    angle:'350deg'
  }],
  "D2": [
    {
      latitude:1.29428,
      longitude:103.77527,
      angle:'90deg'
    },
    {
      latitude:1.29237,
      longitude:103.77971,
      angle:'80deg'
    },
    {
      latitude:1.29189,
      longitude:103.78385,
      angle:'0deg'
    },
    {
      latitude:1.29632,
      longitude:103.78349,
      angle:'270deg'
    },
    {
      latitude:1.29723,
      longitude:103.77876,
      angle:'240deg'
    },
    {
      latitude:1.29958,
      longitude:103.77449,
      angle:'330deg'
    },
    {
      latitude:1.30112,
      longitude:103.77446,
      angle:'320deg'
    },
    {
      latitude:1.30144,
      longitude:103.77446,
      angle:'120deg'
    },
    {
      latitude:1.29884,
      longitude:103.77624,
      angle:'60deg'
    },
    {
      latitude:1.29750,
      longitude:103.78082,
      angle:'60deg'
    },
    {
      latitude:1.29475,
      longitude:103.78470,
      angle:'100deg'
    },
    {
      latitude:1.29174,
      longitude:103.78273,
      angle:'180deg'
    },
    {
      latitude:1.29119,
      longitude:103.78147, //pgpr
      angle:'180deg'
    },
    {
      latitude:1.29297,
      longitude:103.77839,
      angle:'240deg'
    }
  ],
  "K": [
    {
      latitude:1.29185,
      longitude:103.78034,
      angle:'120deg'
    },
    {
      latitude:1.29237,
      longitude:103.78436,
      angle:'350deg'
    },
    {
      latitude:1.29689,
      longitude:103.78272,
      angle:'240deg'
    },
    {
      latitude:1.29746,
      longitude:103.77813,
      angle:'260deg'
    },
    {
      latitude:1.29925,
      longitude:103.77459,
      angle:'200deg'
    },
    {
      latitude:1.29627,
      longitude:103.76957,
      angle:'320deg'
    },
    {
      latitude:1.30139,
      longitude:103.77030,
      angle:'350deg'
    },
    {
      latitude:1.30175,
      longitude:103.77020,
      angle:'70deg'
    },
    {
      latitude:1.30116,
      longitude:103.77331,
      angle:'50deg'
    },
    {
      latitude:1.29747,
      longitude:103.78054,
      angle:'50deg'
    },
    {
      latitude:1.29491,
      longitude:103.78458,
      angle:'90deg'
    },
    {
      latitude:1.29174,
      longitude:103.78272,
      angle:'200deg'
    },
    {
      latitude:1.29104,
      longitude:103.78129,
      angle:'180deg'
    }
  ],
  "L":[
    {
      latitude:1.31924,
      longitude:103.81836,
      angle:'270deg'
    },
    {
      latitude:1.32229,
      longitude:103.81949,
      angle:'250deg'
    },
    {
      latitude:1.32302,
      longitude:103.81346,
      angle:'260deg'
    },
    {
      latitude:1.32314,
      longitude:103.81694,
      angle:'60deg'
    },
    {
      latitude:1.32059,
      longitude:103.81853,
      angle:'140deg'
    }]
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ marginTop: 50 }}>Filter by bus service</Text>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={
            routeSelected == "BTC"
              ? NUS_BTC
              : routeSelected == "L"
                ? BUKITTIMAHCAMPUS
                : NUS
          }
          rotateEnabled={false}
        >
          <Polyline
            coordinates={routeDataShown.checkPointCoordsArray}
            strokeColor="#27f"
            strokeWidth={5}
            tappable={false}
          />
          {routeDataShown.busStopsCoordsArray.map((busStopMarker, index) => (
            <Marker key={index} coordinate={{
              latitude: busStopMarker.latitude,
              longitude: busStopMarker.longitude
            }}>
              <CustomMarker stopName={busStopMarker.name} />
            </Marker>
          ))}
          {activeBusData.length > 0 && activeBusData.map((activeBus, index) => (
            <ActiveBusMarker key={index} coordinate={{
              latitude: activeBus.latitude,
              longitude: activeBus.longitude
            }}
              vehicleLicensePlate={activeBus.licensePlate}
              crowdLevel={activeBus.crowdLevel} />
          ))}
          {MARKERDIRECTIONS[routeSelected] != undefined && MARKERDIRECTIONS[routeSelected].map((directionMarker, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: directionMarker.latitude,
                longitude: directionMarker.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <FontAwesome
                name="location-arrow"
                size={18}
                color="orange"
                style={{ transform: [{ rotate: `${directionMarker.angle}` }] }}
              />
            </Marker>
          ))}
        </MapView>
      </View>
      {NUS_BUS_SERVICES.map((busService, index) => (
        <Pressable key={index} onPress={() => setRouteSelected(busService)}>
          <ServiceCard busService={busService} busStops={fetchDetailedStopNames(busService)} displayedStops={fetchBaseCardData(busService)} />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    height: "50%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});