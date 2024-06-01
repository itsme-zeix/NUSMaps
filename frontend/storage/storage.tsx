import { MMKV } from 'react-native-mmkv';

export const busStopStorage = new MMKV({
    id : 'busStopsStorage',
});

export const busServicesStorage = new MMKV({
    id: "busServicesStorages",
});

export const favoriteBusStopStorage = new MMKV({
    id: "favoriteBusStopStorage"
});

export const favoriteBusServiceStorage = new MMKV({
    id: "favoriteBusServiceStorage"
})