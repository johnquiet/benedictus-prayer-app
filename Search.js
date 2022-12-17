import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TextInput, ToastAndroid, Image, ScrollView, Dimensions, View, Switch, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useFonts } from 'expo-font';
import Advertisement from './Advertisement.js';
import { StatusBar } from 'expo-status-bar';
import AudioSlider from './AudioSlider.js';
import Prayer from './Prayer.js';
import Parse from "parse/react-native.js";
import { useRoute, useIsFocused } from '@react-navigation/native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import { useRecoilState } from 'recoil';
import { sessionSwitchState, catPrayersState } from './AlarmState.js';
import fuzzysort from 'fuzzysort';
import search from './assets/searchblack.png';



//----------------------------------------
//----------------------------------------
// THE SEARCH COMPONENT
//----------------------------------------
//----------------------------------------

// this component searches through the prayers gotten on app launch and stored in catPrayers
// on the basis of a user search term

const Search = ({navigation}) => {


    //----------------------------------------
    // STATE VARIABLES
    //----------------------------------------


    // local variable that is neither read nor set can probably be deleted at some point
    const [prayers, setPrayers] = useState([]);

    // this is a global state variable, a boolean that is toggled every time there is an error
    // going to the DB due to session expiration. most components track this.
    const [sessionSwitch, setSessionSwitch] = useRecoilState(sessionSwitchState);

    // when the app launches this global variable gets set with all of the prayer categories
    // and all of the prayers for the app. this makes for fast loading every where else just a single
    // db call on app launch.
    const [catPrayers, setCatPrayers] = useRecoilState(catPrayersState);

    // array of jsx elements each one representing a prayer that is a search result. rendered in 
    // the interface.
    const [searchResults, setSearchResults] = useState([]);

    // the user's search term. gets updated every time the user types in the search bar
    const [searchInput, setSearchInput] = useState('');

    // keeps track of if the search is running and disables button if it is true so that user can't
    // spam the button
    const [isLoading, setIsLoading] = useState(false);

    // keeps track of if the user is on this tab. if the user runs a search and leaves the tab then 
    // the search gets cleared.
    const isFocused = useIsFocused();

    // on initial render and if the user leaves the tab, clears search results
    useEffect(() => {
        setSearchResults([]);
    }, [isFocused]);

    // on initial render and if the user leaves the tab, clears search bar
    useEffect(() => {
        setSearchInput('');
    }, [isFocused]);

    //----------------------------------------
    // FUNCTIONS
    //----------------------------------------
    
    // function never used can probably delete at some point.
    const loadingTrue = () => {
        setIsLoading(true);
    }

    // this function builds the prayer elements to be included in the search results is used in getResults()
    const buildPrayerElement = (prayerId, prayerTitle, prayerUrl, prayerText, isFavorite, favoriteId) => {
      return (
        <View key={prayerId} style={styles.prayerContainerBuffer}>
          <Prayer id={prayerId} title={prayerTitle} url={prayerUrl} text={prayerText}
          isFavorite={isFavorite} favoriteId={favoriteId}></Prayer>
        </View>
      )
    }

    // this function signs the user out is necessary in case any session expiration errors 
    // are thrown 
    async function signOut() {
      try {
        await GoogleSignin.signOut();
        await Parse.User.logOut();
        // To verify that current user is now empty, currentAsync can be used
        const currentUser = await Parse.User.currentAsync();
        if (currentUser === null) {
          // alert('Success! No user is logged in anymore!');
        }
      } catch (error) {
        console.error(error);
      }
      
    }

    // this function searches catPrayers global variable for the prayers that match the user's 
    // search term, then adds the favorites data to the prayers, and then builds an array of jsx
    // elements (the results) that get added to state and rendered in the ui.
    async function getResults() {
        setIsLoading((l) => { return !l; });

        let prayers = catPrayers.prayerObjects;
        let resultsUnparsed = fuzzysort.go(searchInput, prayers, {key: 'title'});

        let thePrayers = [];

        let firstTen = resultsUnparsed.slice(0, 10);

        for (let i of firstTen) {
            thePrayers.push(i.obj);
        }

        if (thePrayers.length == 0) {
            setIsLoading((l) => { return !l; });
            setSearchResults((results) => { return []; });
            return;
        }

        let prayerElements = [];

        for (let i of thePrayers) {

          let prayerId = i.id;
          let title = i.title;
          let url = i.url;
          let text = i.text;

          let isFavorite = i.isFavorite;
          let favoriteId = i.favoriteId;

          let prayerElement = buildPrayerElement(prayerId, title, url, text, isFavorite, favoriteId);

          prayerElements.push(prayerElement);
        }

        setSearchResults((results) => { return prayerElements; });
        setIsLoading((l) => { return !l; });
    }


    //----------------------------------------
    // THE INTERFACE
    //----------------------------------------


    return (
        <View style={styles.container}>
            <View style={{height: Dimensions.get('window').height*.015}}></View>
            { catPrayers.categoryElements.length > 0 ? 
                <View style={styles.searchContainer}>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <TextInput value={searchInput} style={styles.input} placeholder="enter a prayer name" 
                        placeholderTextColor="#757575" textAlign="center" cursorColor="#a7e7fa"
                        onChangeText={newText => setSearchInput(newText)} onSubmitEditing={getResults}/>
                        <View style={{width: Dimensions.get('window').width*.03}}></View>
                        { isLoading ?

                        <TouchableOpacity style={styles.loadingButton}>
                            <ActivityIndicator size="small" color="#a7e7fa" /> 
                        </TouchableOpacity>
                        :

                        <TouchableOpacity style={styles.searchButton} onPress={getResults}>
                            <Image source={search} style={styles.sizeDown}></Image>
                        </TouchableOpacity>
                        }
                    </View>
                </View> :
                <View style={styles.searchContainer}>
                    <ActivityIndicator size="small" color="#a7e7fa" />
                </View>
            }
            <View style={styles.listContainer}>
                { searchResults.length > 0 ?
                <ScrollView>
                    {searchResults}
                </ScrollView> :
                <View style={styles.quoteContainer}>
                  <Text style={styles.quote}>
                  "Patience, prayer and silence. These are what give strength to the soul." {"\n"} {"\n"}
      
                  - St. Faustina Kowalska
                  </Text>
                </View>
                }
            </View>
            <StatusBar style="light" />
        </View>
    );
}


//---------------------------------
//---------------------------------
// STYLES
//---------------------------------
//---------------------------------


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1D1D1D',
      justifyContent: 'space-between'
    },
    quoteContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    input: {
        height: 40,
        width: (Dimensions.get('window').width)*.73,
        borderWidth: 1,
        borderColor: '#a7e7fa',
        borderRadius: 6,
        backgroundColor: '#2e2e2e',
        color: '#a7e7fa',
        fontFamily: 'monospace'
    },
    title: {
      fontSize: RFPercentage(4.8),
      fontFamily: 'monospace',
      fontWeight: 'bold',
      textAlign: 'center',
      textAlignVertical: 'center',
      color: '#ffffff'
    },
    searchContainer: {
      height: 55,
      alignItems: 'center',
      justifyContent: 'center'
    },
    listContainer: {
      flex: 21,
      justifyContent: 'flex-start'
    },
    adContainer: {
      flex: 1.5,
      justifyContent: 'flex-end'
    },
    prayerContainerBuffer: {
        marginTop: Dimensions.get('window').height*.01,
        marginBottom: Dimensions.get('window').height*.01
    },
    prayerContainerEven: {
        backgroundColor: '#3d3d3d',
    },
    prayerTextContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Dimensions.get('window').height*.02,
      marginTop: Dimensions.get('window').height*.01
    },
    prayerTitleText: {
      fontSize: RFPercentage(2),
      fontFamily: 'monospace',
      textAlignVertical: 'center',
      color: '#ffffff',
      marginBottom: Dimensions.get('window').height*.01,
      lineHeight: RFPercentage(5)
    },
    prayerWordsText: {
      fontSize: RFPercentage(1.8),
      fontFamily: 'monospace',
      textAlign: 'center',
      textAlignVertical: 'center',
      color: '#ffffff',
      marginBottom: Dimensions.get('window').height*.01,
      marginTop: Dimensions.get('window').height*.03,
      lineHeight: RFPercentage(5),
      width: Dimensions.get('window').width*.8
    },
    loadingText: {
        fontSize: RFPercentage(2),
        fontFamily: 'monospace',
        textAlignVertical: 'center',
        textAlign: 'center',
        color: '#a7e7fa'
    },
    button: {
      alignItems: "center",
      backgroundColor: "#474747",
      height: (Dimensions.get('window').height*.04),
      width: (Dimensions.get('window').width*.95),
      justifyContent: "center",
      borderRadius: 7
    },
    blueButton: {
      backgroundColor: '#a7e7fa',
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      height: (Dimensions.get('window').height*.04),
      width: (Dimensions.get('window').height*.04)
    },
    redButton: {
      backgroundColor: '#f77e7e',
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      height: (Dimensions.get('window').height*.04),
      width: (Dimensions.get('window').height*.04)
    },
    buttonText: {
      fontSize: RFPercentage(3),
      color: 'black',
      fontWeight: 'bold'
    },
    backButtonText: {
      fontSize:RFPercentage(1.5),
      fontFamily: 'monospace',
      flex: 1,
      textAlign: "center",
      textAlignVertical: "center",
      color: '#878686'
    },
    sizeDown: {
        transform: [
          {scaleX: (Dimensions.get('window').height/20000)},
          {scaleY: (Dimensions.get('window').height/20000)}
        ]
    },
    searchButton: {
        backgroundColor: '#a7e7fa',
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        height: (40),
        width: (Dimensions.get('window').width*.15)
    },
    loadingButton: {
        backgroundColor: '#2e2e2e',
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        height: (40),
        width: (Dimensions.get('window').width*.15)
    },
    quote: {
      color: '#757575',
      fontFamily: 'monospace',
      fontSize: RFPercentage(2),
      lineHeight: RFPercentage(3.5),
      fontStyle: 'italic',
      textAlign: 'center',
      textAlignVertical: 'center',
      width: Dimensions.get('window').width*.75
    }
  });

export default Search;