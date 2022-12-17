import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ActivityIndicator, ToastAndroid ,Button, Alert, ScrollView, Image,View, StyleSheet, TouchableOpacity, Text, Dimensions } from "react-native";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Parse from "parse/react-native.js";
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRecoilState } from 'recoil';
import { didSignOutState, sessionSwitchState, currentlySignedInState, signInChangeState, catPrayersState, favoritesState} from './AlarmState.js';


//----------------------------------------
//----------------------------------------
// THE PROFILE COMPONENT
//----------------------------------------
//----------------------------------------


const Profile = ({ navigation }) => {

    
    //----------------------------------------
    // STATE VARIABLES
    //----------------------------------------

    // this is a global state variable that is an array of jsx elements, one for each of the 
    // favorite prayers being displayed. the reason it must be global is because it is changed
    // whenever the user unfavorites a prayer on this screen. Pray.js (the prayer component)
    // removes the jsx element for that prayer from this array so that it immediately disappears
    // from the screen instead of at a later time when the database is called.
    const [favoritePrayers, setFavoritePrayers] = useRecoilState(favoritesState);

    // when the app launches this global variable gets set with all of the prayer categories
    // and all of the prayers for the app. this makes for fast loading every where else just a single
    // db call on app launch
    const [catPrayers, setCatPrayers] = useRecoilState(catPrayersState);

    // if the user has previously installed the app on their phone, then uninstalls it, and then installs
    // it again, their old session will be invalid. this will throw an error on first app launch and the
    // app won't work until a sign out occurs. so on the very first time the app launches, it must automatically
    // do a sign out just in case. this variable keeps track of whether that has happened yet.
    const [didSignOut, setDidSignOut] = useRecoilState(didSignOutState);

    // this is a global state variable, a boolean that is toggled every time there is an error
    // going to the DB due to session expiration. most components track this.
    const [sessionSwitch, setSessionSwitch] = useRecoilState(sessionSwitchState);

    // keeps track of changes (not value) in sign in state. Favorites.js subscribes to this so it can update
    // if there's a change in the sign in state. 
    const [currentlySignedIn, setCurrentlySignedIn] = useRecoilState(currentlySignedInState);

    // also keeps track of changes in sign in state but wherease the above changes originate in this component
    // the changes for this below variable originate in Favorites.js and are read here.
    const [isSignedIn, setIsSignedIn] = useRecoilState(signInChangeState);

    const [isLoading, setIsLoading] = useState(false);

    // on initial render, initial app launch sign out, session error, or sign in change, this hook
    // verifies the sign in state of the user so it can be read in this component.
    useEffect(() => {
        isUserSignedIn().then((value) => {
            setCurrentlySignedIn(value);
        })
    }, [didSignOut, sessionSwitch, isSignedIn]);


    //----------------------------------------
    // FUNCTIONS
    //----------------------------------------


    // checks if the user is signed in
    async function isUserSignedIn() {
        const isSignedIn = await GoogleSignin.isSignedIn();
        const currentUser = await Parse.User.currentAsync();
        if (isSignedIn == true && currentUser !== null) {
            return true;
        } else {
            return false;
        }
    };

    // signs in the user and sets state to show that sign in state has changed.
    const doUserLogInGoogle = async function () {
        setIsLoading((l) => { return true; });
        try {
          // Check if your user can sign in using Google on his phone
          await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
          // Retrieve user data from Google
          const userInfo = await GoogleSignin.signIn();
          const googleIdToken = userInfo.idToken;
          
          const googleUserId = userInfo.user.id;
          
          const googleEmail = userInfo.user.email;
          
          // Log in on Parse using this Google id token
          const userToLogin = new Parse.User();
          // Set username and email to match google email
          userToLogin.set('username', googleEmail);
          userToLogin.set('email', googleEmail);
          return await userToLogin
            .linkWith('google', {
              authData: {id: googleUserId, id_token: googleIdToken},
            })
            .then(async (loggedInUser) => {
              // To verify that this is in fact the current user, currentAsync can be used
              const currentUser = await Parse.User.currentAsync();
              console.log(loggedInUser === currentUser);
              // Navigation.navigate takes the user to the screen named after the one
              // passed as parameter

              let currentUserId = currentUser.id;
              const favoriteQuery = new Parse.Query('Favorites');
              favoriteQuery.equalTo('User', { "__type": "Pointer", "className": "_User", "objectId": currentUserId });
              favoriteQuery.includeAll();

              let favorites;

              try {

                favorites = await favoriteQuery.find();

                let favoritePrayerIds = favorites.map((i) => {
                  return { prayerId: i.get('Prayer').id, favoriteId: i.id }
                })

                let prayerObjs = catPrayers.prayerObjects;

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

                setCatPrayers((old) => { 
                  return {
                    categoryElements: old.categoryElements,
                    prayerObjects: prayerObjs
                  }
                });

              } catch (e) {
                await signOut();
                ToastAndroid.show("Login expired. Go to Favorites and Sign In!", ToastAndroid.SHORT);
                setSessionSwitch((s) => { return !s; });
                setIsLoading((l) => { return false; });
                return false;
              }

              setCurrentlySignedIn((old) => { return true; });
              setIsLoading((l) => { return false; });
              return true;
            })
            .catch(async (error) => {
              // Error can be caused by wrong parameters or lack of Internet connection
              Alert.alert('Error 2!', error.message);
              await signOut();
              ToastAndroid.show("Login expired. Go to Favorites and Sign In!", ToastAndroid.SHORT);
              setSessionSwitch((s) => { return !s; });
              setIsLoading((l) => { return false; });
              return false;
            });
        } catch (error) {
          Alert.alert('Error 1!', error.message);
          setIsLoading((l) => { return false; });
          return false;
        }
        setIsLoading((l) => { return false; });
      }

    // signs out the user and sets state to show that sign in state has changed.
    const signOut = async () => {
        setIsLoading((l) => { return true; });
        try {
          await GoogleSignin.signOut();
          await Parse.User.logOut();

          let newPrayerObjs = catPrayers.prayerObjects.map((i) => {
            return {
              id: i.id,
              title: i.title,
              url: i.url,
              text: i.text,
              category: i.category,
              isFavorite: false,
              favoriteId: ''
            };
          })

          setCatPrayers((old) => {
            return {
              categoryElements: old.categoryElements,
              prayerObjects: newPrayerObjs
            }
          });

          setFavoritePrayers((old) => { return []; })
          setCurrentlySignedIn(false);
          setIsLoading((l) => { return false; });
        } catch (error) {
          console.error(error);
          setIsLoading((l) => { return false; });
        }
        setIsLoading((l) => { return false; });
    };

    // deletes the users account via cloud code on back4app then signs out the user and updates sign in state
    async function deleteAccount() {
        setIsLoading((l) => { return true; });
        try {
          const deleteUser = await Parse.Cloud.run('deleteUser');   
          await signOut();

          let newPrayerObjs = catPrayers.prayerObjects.map((i) => {
            return {
              id: i.id,
              title: i.title,
              url: i.url,
              text: i.text,
              category: i.category,
              isFavorite: false,
              favoriteId: ''
            };
          })

          setCatPrayers((old) => {
            return {
              categoryElements: old.categoryElements,
              prayerObjects: newPrayerObjs
            }
          });

          setFavoritePrayers((old) => { return []; })
          setCurrentlySignedIn(false);
          setIsLoading((l) => { return false; });
        } catch (e) {
          await signOut();
          ToastAndroid.show("Login expired. Go to Favorites and Sign In!", ToastAndroid.SHORT);
          setSessionSwitch((s) => { return !s; });
          setIsLoading((l) => { return false; });
        }
        setIsLoading((l) => { return false; });
    }


    //----------------------------------------
    // THE INTERFACE
    //----------------------------------------


    return (
        <View style={styles.container} >
            <View style={{height: Dimensions.get('window').height*.025}}></View>
            <View style={styles.listContainer}>
              { !isLoading ?
                <ScrollView>
                    { currentlySignedIn ?
                        <View>
                            <View key='12345Logoutbutton' style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.button} onPress={signOut}>
                                    <Text style={styles.buttonText}>Sign Out</Text>
                                </TouchableOpacity>
                            </View> 
                            <View key='12345Deletebutton' style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.buttonRed} onPress={deleteAccount}>
                                    <Text style={styles.buttonText}>Delete Account</Text>
                                </TouchableOpacity>
                            </View> 
                        </View>
                        
                        :
                        <View key='12345Loginbutton' style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button} onPress={doUserLogInGoogle}>
                                <Text style={styles.buttonText}>Sign In</Text>
                            </TouchableOpacity>
                        </View> 
                    }
                </ScrollView> :
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#a7e7fa" />
                </View>
              }
            </View>
            <StatusBar style="light" />
        </View>
    );
}


//----------------------------------------
//----------------------------------------
// STYLES
//----------------------------------------
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
      marginBottom: Dimensions.get('window').height*.012
    },
    button: {
      alignItems: "center",
      backgroundColor: "#a7e7fa",
      height: (Dimensions.get('window').height*.06),
      width: (Dimensions.get('window').width*.95),
      justifyContent: "center",
      borderRadius: 7
    },
    buttonRed: {
        alignItems: "center",
        backgroundColor: "#f77e7e",
        height: (Dimensions.get('window').height*.06),
        width: (Dimensions.get('window').width*.95),
        justifyContent: "center",
        borderRadius: 7
    },
    buttonOrange: {
        alignItems: "center",
        backgroundColor: "#fac97f",
        height: (Dimensions.get('window').height*.12),
        width: (Dimensions.get('window').width*.95),
        justifyContent: "center",
        borderRadius: 7
    },
    buttonText: {
      fontSize:RFPercentage(3),
      fontFamily: 'monospace',
      flex: 1,
      textAlign: "center",
      textAlignVertical: "center",
      color: '#292828',
      width: (Dimensions.get('window').width*.8)
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }
  });
  
export default Profile;