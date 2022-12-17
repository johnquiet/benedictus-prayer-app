import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ActivityIndicator, ToastAndroid ,Button, Alert, ScrollView, Image,View, StyleSheet, TouchableOpacity, Text, Dimensions } from "react-native";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Advertisement from './Advertisement.js';
import Parse from "parse/react-native.js";
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRecoilState } from 'recoil';
import { didSignOutState, sessionSwitchState, catPrayersState } from './AlarmState.js';


//----------------------------------------
//----------------------------------------
// THE PRAYERCATEGORIES COMPONENT
//----------------------------------------
//----------------------------------------

// this component is rendered on app launch and contains a button for each of the prayer categories 
// that the db returns. each button when clicked navigates to a screen (Pray.js) showing all of the prayers (Prayer.js)
// belonging to the given category.

const PrayerCategories = ({ navigation }) => {


  //----------------------------------------
  // STATE VARIABLES
  //----------------------------------------

  
  // when the app launches this global variable gets set with all of the prayer categories
  // and all of the prayers for the app. this makes for fast loading every where else just a single
  // db call on app launch.
  const [catPrayers, setCatPrayers] = useRecoilState(catPrayersState);

  // if the user has previously installed the app on their phone, then uninstalls it, and then installs
  // it again, their old session will be invalid. this will throw an error on first app launch and the
  // app won't work until a sign out occurs. so on the very first time the app launches, it must automatically
  // do a sign out just in case. this variable keeps track of whether that has happened yet.
  const [didSignOut, setDidSignOut] = useRecoilState(didSignOutState);

  // this is a global state variable, a boolean that is toggled every time there is an error
  // going to the DB due to session expiration. most components track this.
  const [sessionSwitch, setSessionSwitch] = useRecoilState(sessionSwitchState);

  // on initial render (app launch), after the initial sign out, and if any session expiration errors are thrown,
  // this hook gets all prayers and categories from the db and saves them in the global state variable
  // that most components access. so a single db call, and then none for the rest of the app except
  // for updating favorites data.
  useEffect(() => {
    getCategories().then((value) => {
      setCatPrayers(value);
    });
  }, [didSignOut, sessionSwitch]);

  // due to possible session errors as a consequence of a user installing, uninstalling, then reinstalling
  // the app, an initial sign out is necessary just in case on the very first launch of the app. while
  // this hook always run, logic is only run in the function signOutFirstLaunch on the very first launch.
  useEffect(() => {
    signOutFirstLaunch().then(() => {
      setDidSignOut(true);
    });
  });


  //----------------------------------------
  // FUNCTIONS
  //----------------------------------------


  // on app launch gets all categories and prayers from the db. in the above hook these are saved
  // in the global state variable catPrayers for access throughout the app.
  async function getCategories() {
    console.log('getting categories line 75 prayercategories.js');
    const catQuery = new Parse.Query('PrayerCategories');
    catQuery.addAscending('Name');
    try {
      let categories = await catQuery.find();
      let buttonElements = [];
      for (let i of categories) {
        let buttonElement = buildButtonElement(i.id, i.get('Name'));
        buttonElements.push(buttonElement);
      }

      // get all prayers
      let prayerQuery = new Parse.Query('Prayers');
      prayerQuery.addAscending('Name');
      let prayers = await prayerQuery.find();

      let prayerObjs = [];

      for (let i of prayers) {
        let prayer = {
          id: i.id,
          title: i.get('Name'),
          url: i.get('Recording').url(),
          text: i.get('Words'),
          category: i.get('Category').id,
          isFavorite: false,
          favoriteId: ''
        }
        prayerObjs.push(prayer);
      }

      let signedIn = await GoogleSignin.isSignedIn();

      if (signedIn) {

        let currentUser = await Parse.User.currentAsync();
        let currentUserId = currentUser.id;
        // get users favs add to state
        const favoriteQuery = new Parse.Query('Favorites');
        favoriteQuery.equalTo('User', { "__type": "Pointer", "className": "_User", "objectId": currentUserId });
        favoriteQuery.includeAll();

        let favorites = await favoriteQuery.find();

        let favoritePrayerIds = favorites.map((i) => {
          return {prayerId: i.get('Prayer').id, favoriteId: i.id }
        })

        for (let i of favoritePrayerIds) {
          prayerObjs = prayerObjs.map((j) => {
            if (i.prayerId == j.id) {
              return {
                id: j.id,
                title: j.title,
                url: j.url,
                text: j.text,
                category: j.category,
                isFavorite: true,
                favoriteId: i.favoriteId
              };
            } else {
              return j;
            }
          })
        }

      }

      // favorites data added if user was signed in already

      let prayerState = {
        categoryElements: buttonElements,
        prayerObjects: prayerObjs
      }


      return prayerState;
    } catch (e) {
      console.log(e);
      console.log('prayerCatsSessionError');
      await signOut();
      ToastAndroid.show("Login has expired. Go to Favorites and Sign In!", ToastAndroid.LONG);
      setSessionSwitch(!sessionSwitch);
      return [];
    }
  }

  // build each button element for the above function
  const buildButtonElement = (catId, catName) => {
    return ( 
    <View key={catId} style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate(catId)}>
        <Text style={styles.buttonText}>{catName}</Text>
      </TouchableOpacity>
    </View> 
    )
  }

  // signs the user out if it is the very first launch of the app.
  async function signOutFirstLaunch() {
    let isFirst = await AsyncStorage.getItem('@isFirst');
    if (isFirst === null) {
      // is first launch 
      console.log('is first launch');
      await signOut();
      await AsyncStorage.setItem('@isFirst', 'nope');
    } else {
      console.log('is not first launch');
    }
  }

  // signs the user out any time. in paritcular this is used if a db call throws a session error.
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
  
  // not called can probably be deleted at some point.
  async function getCurrentUser() {
    const currentUser = await Parse.User.currentAsync();
    return currentUser;
}

  // will not attempt to render anything if initial sign out on the very first app launch hasn't occurred
  // prevents errors.
  if (!didSignOut) {
    return null;
  }


  //----------------------------------------
  // THE INTERFACE
  //----------------------------------------


  return (
      <View style={styles.container} >
          <View style={{height: Dimensions.get('window').height*.025}}></View>
          <View style={styles.listContainer}>
            <View style={styles.logicContainer}>
              { catPrayers.categoryElements.length > 0 ? 
              <ScrollView>
                <View key='12345Loginbutton' style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Favorites')}>
                    <Text style={styles.buttonText}>Favorites</Text>
                  </TouchableOpacity>
                </View> 
                {catPrayers.categoryElements}
              </ScrollView> : 
              <View>
                <ActivityIndicator size="large" color="#a7e7fa" />
                <Text style={styles.quote}></Text>
                <Text style={styles.quote}>
                  Just a moment. Loading prayers for your use. 
                  May your time of prayer bring you closer to God.
                </Text>
              </View>
              }
            </View>
          </View>
          <View style={styles.adContainer}>
                <Advertisement></Advertisement>
            </View>
          <StatusBar style="light" />
      </View>
  );
}


//----------------------------------------
// STYLES
//----------------------------------------


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
    listContainer: {
      flex: 21.5,
      justifyContent: 'flex-start'
    },
    adContainer: {
      flex: 1.5,
      justifyContent: 'flex-end'
    },
    buttonContainer: {
      flex: 1,
      alignItems: 'center',
      marginBottom: Dimensions.get('window').height*.025
    },
    button: {
      alignItems: "center",
      backgroundColor: "#a7e7fa",
      height: (Dimensions.get('window').height*.12),
      width: (Dimensions.get('window').width*.95),
      justifyContent: "center",
      borderRadius: 7
    },
    buttonText: {
      fontSize:RFPercentage(4),
      fontFamily: 'monospace',
      flex: 1,
      textAlign: "center",
      textAlignVertical: "center",
      color: '#292828',
      width: (Dimensions.get('window').width*.8)
    },
    logicContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
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
  
export default PrayerCategories;