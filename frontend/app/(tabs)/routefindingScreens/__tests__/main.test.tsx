import React from 'react';
import { render, waitFor} from '@testing-library/react-native';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import App from '../Main';
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const MockMapView = (props) => <div {...props} />;
  const MockMarker = (props) => <div {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});


jest.mock('axios'); //used to simulate api call fails

const DEFAULTLOCATION = {
  latitude: 1.3521,
  longitude: 103.8198,
};

const TESTLOCATION = {
  latitude: 1.3489977386432621,
  longitude: 103.7492952313956,
};



describe('Straight forward toasts/error handling', () => {  
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('requests location permission and checks if the screen is rendered correctly + whether the mapview renders correctly', async () => {
    //VERY SLOW >5000ms when clearCache flag is specified in npx jest
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: TESTLOCATION,
    });

    const { getByTestId } = render(
        <App />
    );
    const marker = getByTestId('current-location-marker');
    const map = getByTestId('current-location-map');

    await waitFor(() => {
        expect(map).toBeTruthy();
    })
    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(marker.props.coordinate).toEqual({
        latitude: TESTLOCATION.latitude,
        longitude: TESTLOCATION.longitude,
      });
      expect(map.props.region).toEqual({
        latitude: TESTLOCATION.latitude,
        longitude: TESTLOCATION.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    });
  }, 10000);
  it('handles permission denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { getByTestId } = render(
        <App />
    );

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Permission to access location was denied.',
        text2: 'Please try again later',
        position: 'top',
        autoHide: true,
      });
    });

    await waitFor(() => {
      const marker = getByTestId('current-location-marker');
      const map = getByTestId('current-location-map');
      expect(marker.props.coordinate).toEqual({
        latitude: DEFAULTLOCATION.latitude,
        longitude: DEFAULTLOCATION.longitude,
      });
      expect(map.props.region).toEqual({
        latitude: DEFAULTLOCATION.latitude,
        longitude: DEFAULTLOCATION.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    });
  });

  it('handles permission granted but location cannot be attained', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue("GPS failed");
    render(
        <App/>
    );
    await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
            type: "error",
            text1: "Failed to obtain location, GPS failed",
            text2: "Please try again later",
            position: "top",
            autoHide: true,
        })
    });
  });
});

// THIS TEST WAS USED TO DEBUG THE ENV VARIABLES, IT DOES NOT WORK UNLESS <Text>{<apiKey>}</Text> is present in Main.tsx
// describe('checks to see if env variables are loaded', () => {
//   afterEach(() => {
//     jest.resetModules();
//     jest.clearAllMocks();
//   });
//   it("checks if env variables are loaded through expo constants", async () => {
//       (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
//       (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
//         coords: TESTLOCATION,
//       });
//       const {getByText} = render(<App/>);
//       // const apiKeyText = await screen.findByText("mockedValidKey");
//       // expect(apiKeyText).toBeTruthy();
//       // const tokenText = await screen.findByText("mockedValidToken");
//       // expect(tokenText).toBeTruthy();
//       expect(getByText('globalMockedValidKey')).toBeTruthy();
//       expect(getByText('globalMockedValidToken')).toBeTruthy();
//     });  
// }); 