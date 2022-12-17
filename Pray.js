import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ToastAndroid, Image, ScrollView, Dimensions, View, Switch, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useFonts } from 'expo-font';
import Advertisement from './Advertisement.js';
import { StatusBar } from 'expo-status-bar';
import AudioSlider from './AudioSlider.js';
import Prayer from './Prayer.js';
import Parse from "parse/react-native.js";
import { useRoute } from '@react-navigation/native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import { useRecoilState } from 'recoil';
import { sessionSwitchState, catPrayersState, currentlySignedInState } from './AlarmState.js';


//----------------------------------------
//----------------------------------------
// THE PRAY COMPONENT
//----------------------------------------
//----------------------------------------


// when a user clicks on a prayer category button from PrayerCategories.js this component renders 
// all the prayers that belong to that category. because all prayers were fetched on app launch,
// this component does not need to fetch prayers from the db, but simply whether each prayer in the 
// category has been favorited by the current user. the reason this favorites data couldn't have been fetched
// once on a app launch is because since then a user may have favorited a new prayer, and generated
// an new favorite id in the db, which necessitates that the app have that new id for future deletions.

const Pray = ({navigation}) => {

    
    //----------------------------------------
    // STATE VARIABLES
    //----------------------------------------


    // this state variable is an array of jsx elements, one for each prayer that belongs to the category
    // these are rendered in the interface.
    const [prayers, setPrayers] = useState([]);

    // this is a global state variable, a boolean that is toggled every time there is an error
    // going to the DB due to session expiration. most components track this.
    const [sessionSwitch, setSessionSwitch] = useRecoilState(sessionSwitchState);

    // when the app launches this global variable gets set with all of the prayer categories
    // and all of the prayers for the app. this makes for fast loading every where else just a single
    // db call on app launch.
    const [catPrayers, setCatPrayers] = useRecoilState(catPrayersState);

    // keeps track of changes (not value) in sign in state. Favorites.js and Pray.js subscribes to this so it can update
    // if there's a change in the sign in state. 
    const [currentlySignedIn, setCurrentlySignedIn] = useRecoilState(currentlySignedInState);

    // the route name is the id of the category the prayers of which are being rendered so need that
    const route = useRoute();

    // on initial render and in the event of session expiration, get all prayers from global state that
    // belong to this category and if the user is signed in go to the db to find out which are favorited
    useEffect(() => {
      getPrayers().then((value) => {
        setPrayers((oldValue) => { return []; });
        setPrayers((oldValue) => { return value; });
      });
    }, [sessionSwitch, currentlySignedIn, catPrayers]);


    //----------------------------------------
    // FUNCTIONS
    //----------------------------------------

    // this function builds an array of jsx elements, one for each prayer belonging to the category
    // each jsx element is passed via props the prayer data as well as whether the prayer is a favorite
    // or not.
    async function getPrayers() {

      let categoryId = route.name;
  
      let thePrayerObjs = catPrayers.prayerObjects;

      let thePrayers = thePrayerObjs.filter((obj) => {
        return obj.category == categoryId;
      });

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
      
      return prayerElements;

    }

    // this function builds the jsx element for the above generated array
    const buildPrayerElement = (prayerId, prayerTitle, prayerUrl, prayerText, isFavorite, favoriteId) => {
      return (
        <View key={prayerId} style={styles.prayerContainerBuffer}>
          <Prayer id={prayerId} title={prayerTitle} url={prayerUrl} text={prayerText}
          isFavorite={isFavorite} favoriteId={favoriteId}></Prayer>
        </View>
      )
    }

    // this function signs out the user. the reason this function is here even though this screen
    // does not have a sign out button is because a sign out is necessary if a session expiration 
    // happens while the user is using the app. this function is called in getFavorites in that
    // scenario.
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


    //----------------------------------------
    // THE INTERFACE
    //----------------------------------------


    return (
        <View style={styles.container}>
            <View style={{height: Dimensions.get('window').height*.015}}></View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} 
                  onPress={() => navigation.navigate('PrayerCategories')}>
                    <Text style={styles.backButtonText}>Back to Prayer Categories</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
                <ScrollView>
                    {prayers}
                </ScrollView>
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
    title: {
      fontSize: RFPercentage(4.8),
      fontFamily: 'monospace',
      fontWeight: 'bold',
      textAlign: 'center',
      textAlignVertical: 'center',
      color: '#ffffff'
    },
    buttonContainer: {
      flex: 1.5,
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
    }
  });

export default Pray;