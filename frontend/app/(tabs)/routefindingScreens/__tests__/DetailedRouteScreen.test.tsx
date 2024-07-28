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
const mockDestination = JSON.stringify({ latitude: 1.397288346798842, longitude: 103.7470784569654 });
const mockBaseResultsData = JSON.stringify(
{
    types: ['SUBWAY', 'TRAM', 'WALK'],
    journeyLegs: [
        { serviceType: 'DT', type: 'SUBWAY' },
        { serviceType: 'BP', type: 'TRAM' },
        { serviceType: 'NONE', type: 'WALK' },
        ],
    journeyTiming: JOURNEYTIMINGTEST,
    wholeJourneyTiming: WHOLEJOURNEYTIMINGTEST,
    stopsCoordsArray: [
      "{\"latitude\":1.2789739,\"longitude\":103.8457626,\"name\":\"Origin\"}",
      "{\"latitude\":1.2766035,\"longitude\":103.8459617,\"name\":\"TANJONG PAGAR MRT STATION\"}",
      "{\"latitude\":1.2815256,\"longitude\":103.8389854,\"name\":\"OUTRAM PARK MRT STATION\"}",
      "{\"latitude\":1.2862186,\"longitude\":103.8269134,\"name\":\"TIONG BAHRU MRT STATION\"}",
      "{\"latitude\":1.2896751,\"longitude\":103.8166904,\"name\":\"REDHILL MRT STATION\"}",
      "{\"latitude\":1.2948146,\"longitude\":103.8059227,\"name\":\"QUEENSTOWN MRT STATION\"}",
      "{\"latitude\":1.3024474,\"longitude\":103.798295,\"name\":\"COMMONWEALTH MRT STATION\"}",
      "{\"latitude\":1.3072658,\"longitude\":103.790017,\"name\":\"BUONA VISTA MRT STATION\"}",
      "{\"latitude\":1.3114548,\"longitude\":103.7785844,\"name\":\"DOVER MRT STATION\"}",
      "{\"latitude\":1.3151999,\"longitude\":103.7652135,\"name\":\"CLEMENTI MRT STATION\"}",
      "{\"latitude\":1.3330748,\"longitude\":103.7422654,\"name\":\"JURONG EAST MRT STATION\"}",
      "{\"latitude\":1.348992,\"longitude\":103.7495558,\"name\":\"BUKIT BATOK MRT STATION\"}",
      "{\"latitude\":1.3586119,\"longitude\":103.75188,\"name\":\"BUKIT GOMBAK MRT STATION\"}",
      "{\"latitude\":1.3851111,\"longitude\":103.7443785,\"name\":\"CHOA CHU KANG MRT STATION\"}",
      "{\"latitude\":1.3974593,\"longitude\":103.7474322,\"name\":\"YEW TEE MRT STATION\"}",
      "{\"latitude\":1.3975061,\"longitude\":103.7469605,\"name\":\"Destination\"}"
  ],
  polylineArray: "owxFsiyxR`@[BAhAy@HG\\WMQLYL@JDB?BABABCDEDI??BE@AHOJIDCJOBK?E?EAGo@[QKCAECOIAA@CCECAAAkAo@MEc@U_@QCCMGSI[SGCE?AAQICA?@AGACmAm@KEeAi@KI}Ay@SMA?CCA@A??@AAOGCA?AAC??ECc@UABe@W[QEAA@E@GC[OA?BG?A?AECcAg@q@]OIOOKKEKKSAEQ]IAu@e@K{B?C?K?CAGuCU??@UcAEmFSiAGm@Ei@Gm@Ke@K]IoBg@s@Se@Oo@WYMOIEAAA??CCEAECGCECGEKGgAm@a@S]MUIICICc@Ka@IWESCc@Ce@Ck@?a@BI?Q@a@D_@FSBa@JQF_@JUJYLk@ZwBnA??????eE`COJo@`@sBvAiIrFaBrAuAbBaAvAgAzBe@zA{A|G???@iA|EKh@QrAIh@Gn@{@pIm@xFmA~I??CHc@~CUvAYzAIn@Ir@Al@?j@Dr@^jDFt@Bn@Cn@Ch@Gf@Mn@Ql@Sd@OZWb@W\\[\\[V]X[R]Pa@Nw@Vs@L}@Jm@BiCH??Q@sCJQ?Q?Q?Q?QAQAQAQCQCOCQCQEOEQG_@M{MyEq@U_@OOGOGOIOGOIMIOIMIMKMIMKMKMKMKKKKMMKKMKMIKKOKMS[]m@_JoOYe@??eCiEy@iAaAgAw@u@w@q@_Am@_Ag@}Am@aAWeAS}ASaCYo@My@Uy@[OGMGOIOIMIMIOKMI[WYW[W}GaG??CCgFoEk@e@WSMK[U]U]SMI]SOIOG]S_@OOGOGa@OOG_@Ma@Ma@KOEc@KOEc@Ia@Ic@Ga@GWC]EuEa@u@Gc@GOCi@I]Ga@Ga@Ka@Is@QiD}@a@Ka@Ic@IUE]EQCQAQAQAQAQAQ?Q?Q@Q?Q@Q?QBQ@Q@QBc@DmEl@??c@FcDb@{ATk@Jm@N}@Vo@VeAd@cBp@y@T}@PcAJ_ABeAAq@Eu@Ke@Is@Q_A[m@Qm@Ku@IwCK??c@AgDIc@AY?mD?u@?u@@iFHu@@e@?c@Ac@AQAc@EQAa@Ec@EeRgCuL_B????mDe@aGw@QCOCQEQCGAIAOEQCOEQEOEQGOEOGOGMECAOGOGMIOGIEEC}DkBMGOGOIOGMIOGOIOIOGMIOIA?MGcT_LOIMIOG??OIOGOIOGOGKECAOGOGOEQGMEA?QEOEQEOEQCQCQCQAQCQAQAQAQ?QAQ?Q@Q?Q?Q@Q@QBQ@OBQBQBQBODQDQDODODKDE@OFOFOFOFOFOHOFGDGBa`@vQ??YN{BdAOFOHOFOFOF??OFOFQDODQDODQDQBOBQBC?MBQ@Q@QBQ@K@E?wQjA}Ij@Q@Q@QBQ@Q@E@K@QBQBOBQBQDODQDODQDODQFODOFOFOHOFOFOHMHOHMHOHMJMHMJGDEDMJKJMJKJMJ?@KH{HjH??CBoBhBMJKLMJKHA?MJMJMHOHMJOFMHOHOFOFOF??QDOFODOFA?yFbBQFG@GBoRrFODOFQDOFODKDC@QFOFOFOFOFOHMHOFOHMHOHMJMHMHOJKJMJMHMLKJMJKJKLKJKLKLKLKLILKLILGHADKLINGLINILEJCByJvQsPzZILINILGLA@ILINILILKNILKLILKLKLKLILKJKLMLKJKLKJMLKJMJKJMJMJMJKJMJMJMHMJOHMJMHMHOHMHOHMHOHOHMHOFOHOFOFOHOFOFOFOFOFQDOFODQFODOFQDODQDODQBQDODQBQDOBQBQDQBQBO@QBQBQ@QBQ@QBQ@Q@Q@Q@Q@E?K?Q@Q@Q?Q?Q@Q?Q?Q?QAQ?Q?QAQ?QAQAQAQ?QCQAQAQAQCQAKAEAOA??QCQCQCQEOCQCQEOEQEOEQEOEQGOEQGMEA?OGOGOGOGMEAA_@OQGOGOEOGOGQECAKEQEOEQCQEOCQCQCQAQAQCO?A?QAQAQ?Q?Q?Q?O?A?c@?Q?Q?Q?Q?QAQ?KAE?QAQAQCQAQCQCQCOEQEQEOEOEQGOEOGOGOIOGOIMICAKGMIMKMIMKMIOKAAKIMIMKMIMKMIIGCCOIMIOIOGMIOIA?MGOGOIOGOGOGIEEAcIaDOGOGOGEAICQGGCGAOGQEOEICGAOGQEOEGCGCQEKECAOGOGOGKECAqCgAk@U??eCcAOGOGOGMEAAOGECIEMIOGOIECIE]QOIMIOGOIOGAAMEOGOGOGQEOGQEOEQEOCQEQCQCOCQCQAQAQCA?OAQ?QAQAQ?QAA?O?s^w@S?QAQ?O?A?Q?Q?C?M?Q?Q@Q?C?M@Q?Q@Q?C?M?M?C?Q?Q?QAM?C?wCE??G?I?mGEQAQ?Q?Q?Q???S?Q?Q@Q@Q@Q@Q@O@OBA?QBQBQBQBMBA?QBQBQDC?KBaK`BQBQBODQBQBODMBC@QDODODQFODOFC@KDQFOFMFOHOFOHC@KDyJtEMFC@KFOFOHOHMFOHOFMHA?MHMFA?sHzDOH??OHMHOHOFMHA@MFMHA@MFOHA?KHOFMHOHOHC@KDMHC@KDgCrA????}OjIMFOHOHMHOFOHMHGDGBMJMHOHMJMHMJMJMJMHKLMJMJKJGFEBKLKJKLKLKJKLML?@KHkBxBKJKLKLKLKJILKN??ILILKNGLINILGNINGNGNGNEPGNENEPENEPCNEPCPCNCPCPAPAPAPAPAPAP?P?P?P?P?P@P@N@P@P@L?B@PBPBPBPBNBPBP@J@Dx@tF@D??d@fDBNBP@H@FBPBN@P@L@B@P@P@P@B@L@P@P@J@B@PBP@PBN?@BPBNBP@F@HdGla@BNBPBPBPDNBPBPDN?@DNBNDPDNDPFNDPDNFNFNFNFNFPFLFNHNFNHNHLFNHLJNHLHLHNJLJLHLJLJLFHB@JLJLJJLLJJJJLLJJBBHF~D|DJLLJJJLLJJJLBBFFJLJLJJJLJLJLHLJLHLJNHLHLHNHLHNHLHNFNHNFLHNFNFNFNDJ@BFNFNFPDNFNFN@BBJ`ArCFPFNDN@@DLFNFNHN@DDHFNHNDJ@BHLFNFNBDDHFNFNFN@FBFFNFPDN@?~@pCBD??|@nCFNFNDN@DDJDNDNFP@FBFDPBNDP??DNDPDN@FBHDNDPFNBH@DFPDNFN@@DLDPFNFNDNDPFN?@DNDNBPDNBPDPBNBP@PBP@PBP?F@F@P?P@P@P?P@P?F?HHxC`@nQ?P@P?P@P@P?N@P@B@L@P@PBPBP@PBNDPBPBNBL@BDPDNDPDNDNDPDN@DBJjGdULb@??nCzJDPDNFPDNFNBL@@FPFNFNFNHLFNHNHLHNHLJLHNJL@@FJJJJLJLLJJLJJ@@HJtCzCJLJLJJJLJJJLJLFHBBHLJLHNHLHLHNHLHNFNHNFNFNFNFNDNFPDNDNDPDNDPDNBPBPBPBNBPBP@P@P@P@P@P?B@L?P@N?P?P?P?P?P?D?J?pT?V???`G?P?P?P?P@J?D?P@N@P@P@P@P@P@@@NBPBP@NBP@@@NJv@b@jDBPBPBPBNBPDP@F@FDPDPDNDNDPFNDNFNFNFNHNFNHNFLHNHLJNHLJLHLJLJLJJJLLJJLLJJJLJLHBBVP\\TNHLH^PNH\\NnClA^N^P\\R\\RLH\\TZTJJPNHHJJJJLLJLJJHL??JLHLJNHLHLJLFL@@LPZf@HNHLJL??HLJLHL??JLJLHLDDDFJLJLHL??JLHLJLHL?@HLJLHNBDDFnAtB??DD`BlCHNHLHNHLHN@BFJFNHLFNFNFNFNFPFN??DNFNDPDNDPDN??DNjAjEDNDNDPDN@@BNDPBNDPBPBJ?BBPBPBPBN@L?BhEf]BP@PBPBPBNDPBPBL?@DPDPDNDNDPDNFPDNFNFNFNFNHNFNHLHNHLHNHLJLHLJLHLJLJLJLLJJLJJLJLJJJLJLJLHNJLHLHNHLHNHNFNHNFNFNFNFNFNFPDNFNDPDNDPBPDNBPDPBPBPBP@NBP@P@P@P@P?P@P?R@P?PAP?P?PAPA??PAPAPAPANCPAPCPAHAFAbl@}FNAPCPCPAPAPCL?BAPAPAPAP?PAPAP?P?PAP?P?P?P@P?P@P?P@P@P?PBP@P@P@PBP@P@PBPBD?JBPBPBNBPDPBNBD@JBfl@hKJ@AH??Kd@O|@NB",
},
); 
// Adjust this to your actual mock data
jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    useLocalSearchParams: () => {
        // Define mock values directly within the function
        //test case doesnt use bus, as that lead to very funky mocking required, which is not the point of this test
      return {
        origin: mockOrigin,
        destination: mockDestination,
        baseResultsCardData: mockBaseResultsData
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

jest.mock("react-native-maps", () => {
    const React = require("react");
    const MockMapView = (props) => <div {...props} />;
    const MockMarker = (props) => <div {...props} />;
    const MockPolyline = (props) => <div {...props} />;
    return {
      __esModule: true,
      default: MockMapView,
      Marker: MockMarker,
      Polyline: MockPolyline
    };
  });
  

describe('DetailedRouteScreen tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('renders mapview component', async ()=> {
        const { getByTestId } = render(<DetailedRouteScreen/>);
        await waitFor( () => {
          expect(getByTestId('test')).toBeTruthy();
          expect(getByTestId('current-location-map')).toBeTruthy();
          expect(getByTestId('current-location-marker')).toBeTruthy();
    });
  });

  test('renders polyline component', async ()=> {
      const { getByTestId } = render(<DetailedRouteScreen/>);
      await waitFor( () => {
        expect(getByTestId('test')).toBeTruthy();
        expect(getByTestId('current-location-map')).toBeTruthy();
        expect(getByTestId('current-location-polyline')).toBeTruthy();
      });
    });
  
  
});

