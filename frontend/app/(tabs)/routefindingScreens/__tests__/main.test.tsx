import React, { createRef } from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import App from '../Main';
import Constants from 'expo-constants';
import axios from 'axios';
import { RouteSearchBar } from '@/components/RouteSearchBar';

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
const oneMapsAPIToken = "mockedToken"; // Mock the oneMapsAPIToken

const TESTLOCATION = {
  latitude: 1.3489977386432621,
  longitude: 103.7492952313956,
};

describe('Straight forward toasts/error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests location permission and checks if the screen is rendered correctly + whether the mapview renders correctly', async () => {
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
  });

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
    const { getByTestId } = render(
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

describe('more complicated toasts/error handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
      });
    it('shows a toast message when the server request fails because of a missing onemaps api token', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
          coords: TESTLOCATION,
        });
        // Arrange: mock axios to reject with an error
    
        const origin = { latitude: 1.3521, longitude: 103.8198 };
        const destination = { latitude: 1.3521, longitude: 103.8198 };
    
        let fetchBestRoute;
    
          render(
            <App
              ref={(ref) => {
                if (ref) {
                  fetchBestRoute = ref.fetchBestRoute;
                }
              }}
            />
          );
        // Act
        await act(async () => {
            await fetchBestRoute(origin, destination);
            // Expected error
          }
      );
    
        // Assert: Check if the Toast was shown with the correct message
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Server issues, please try again later. API TOKEN ERROR',
          text2: 'Please try again later',
          position: 'top',
          autoHide: true,
        });
      });
    beforeAll(() => {
        // Override environment variables before running tests
        process.env.ONE_MAPS_API_TOKEN = 'mockedValidToken';
      });
    afterAll(() => {
        // Clean up environment variable after tests
        delete process.env.ONE_MAPS_API_TOKEN;
      });
    
    // it('shows a toast message when the server request fails because of backend issue, reflected in axios status', async () => {
    //     (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    //     (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
    //       coords: TESTLOCATION,
    //     });
    //     const oneMapsAPIToken = 'mockedValidToken'; // Set a valid token for testing
    //     (axios.post as jest.Mock).mockRejectedValue(new Error('Network Error'));
    //      const origin = { latitude: 1.3521, longitude: 103.8198 };
    //     const destination = { latitude: 1.3521, longitude: 103.8198 };
    
    //     let fetchRoutesFromServer;
    
    //       render(
    //         <App
    //           ref={(ref) => {
    //             if (ref) {
    //                 fetchRoutesFromServer = ref.fetchRoutesFromServer;
    //             }
    //           }}
    //         />
    //       );
    //     // Act
    //     await act(async () => {
    //         await fetchRoutesFromServer(origin, destination);
    //         // Expected error
    //       }
    //     );
    //     expect(Toast.show).toHaveBeenCalledWith({
    //         type: 'error',
    //         text1: 'Server issues, please try again later.',
    //         text2: 'Please try again later',
    //         position: 'top',
    //         autoHide: true,
    //       });
    // })

})
