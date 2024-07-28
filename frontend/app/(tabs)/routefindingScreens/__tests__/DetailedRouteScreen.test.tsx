import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react-native';
import DetailedRouteScreen from '../DetailedRouteScreen';


//drs accepts baseResultsCardData (one element), destination, originCoords
const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
    isReady: true
};
const JOURNEYTIMINGTEST = '15 mins';
const WHOLEJOURNEYTIMINGTEST = '12:00 PM - 12:15 PM';
const mockOrigin = JSON.stringify({ latitude: 1.3521, longitude: 103.8198 });
const mockDestination = JSON.stringify({ latitude: 1.3975288346798842, longitude: 103.7470784569654 });
const mockBaseResultsData = JSON.stringify([
{
    types: ['SUBWAY', 'TRAM', 'WALK'],
    journeyLegs: [
        { serviceType: 'DT', type: 'SUBWAY' },
        { serviceType: 'BP', type: 'TRAM' },
        { serviceType: 'NONE', type: 'WALK' },
        ],
    journeyTiming: JOURNEYTIMINGTEST,
    wholeJourneyTiming: WHOLEJOURNEYTIMINGTEST,
},
]); // Adjust this to your actual mock data

jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    useLocalSearchParams: () => {
        // Define mock values directly within the function
        //test case doesnt use bus, as that lead to very funky mocking required, which is not the point of this test
      return {
        origin: mockOrigin,
        destination: mockDestination,
        baseResultsData: mockBaseResultsData
      };
    },
    useRouter: () => mockRouter
}));
jest.mock('@expo/vector-icons/MaterialIcons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return ({ name, ...props }) => {
      return <Text {...props}>{name}</Text>;
    };
  });
jest.mock('@expo/vector-icons/Ionicons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return ({ name, ...props }) => {
      return <Text {...props}>{name}</Text>;
    };
  });


describe('DetailedRouteScreen tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('renders mapview component', async ()=> {
        const { getByTestId } = render(<DetailedRouteScreen/>);
        waitFor(
          expect(getByTestId('test')).toBeTruthy();

        expect(getByTestId('current-location-map')).toBeTruthy();
    });

});

