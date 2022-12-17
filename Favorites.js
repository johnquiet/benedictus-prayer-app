import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ToastAndroid, Image, Alert, ScrollView, Dimensions, View, Switch, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useFonts } from 'expo-font';
import Advertisement from './Advertisement.js';
import { StatusBar } from 'expo-status-bar';
import AudioSlider from './AudioSlider.js';
import Prayer from './Prayer.js';
import Parse from "parse/react-native.js";
import { useRoute } from '@react-navigation/native';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { useRecoilState } from 'recoil';
import { favoritesState, sessionSwitchState, signInChangeState, currentlySignedInState, catPrayersState } from './AlarmState.js';


//----------------------------------------
//----------------------------------------
// THE FAVORITES COMPONENT
//----------------------------------------
//----------------------------------------


// this component is displayed when the user goes to the prayer tab and clicks on the favorites button.
// if the user is signed in, this component displays all of the prayers that the user has favorited.
// if the user is not signed in, this component just displays a button the user can click to sign in.

const Favorites = ({navigation}) => {


    //----------------------------------------
    // STATE VARIABLES
    //----------------------------------------

    // this is a global state variable that is an array of jsx elements, one for each of the 
    // favorite prayers being displayed. the reason it must be global is because it is changed
    // whenever the user unfavorites a prayer on this screen. Pray.js (the prayer component)
    // removes the jsx element for that prayer from this array so that it immediately disappears
    // from the screen instead of at a later time when the database is called.
    const [favoritePrayers, setFavoritePrayers] = useRecoilState(favoritesState);

    // this is one of a few global variables that exist in the app keeping track of sign in or sign out
    // events. the reason there are multiple is because of how the app grew organically from a mere 
    // alarm clock app to a full prayer app with a user system. as components were added, more variables 
    // were added. there is nothing programmatically wrong with the current set up, but be careful when changing
    // so that all variables are accounted for.
    const [isSignedIn, setIsSignedIn] = useRecoilState(signInChangeState);

    // this is a global state variable, a boolean that is toggled every time there is an error
    // going to the DB due to session expiration. most components track this.
    const [sessionSwitch, setSessionSwitch] = useRecoilState(sessionSwitchState);

    // this is another global variable tracking sign in events. this one tracks sign in events in Profile.js 
    // and is subscribed to here so that everything gets updated.
    const [currentlySignedIn, setCurrentlySignedIn] = useRecoilState(currentlySignedInState);

    // when the app launches this global variable gets set with all of the prayer categories
    // and all of the prayers for the app. this makes for fast loading every where else just a single
    // db call on app launch.
    const [catPrayers, setCatPrayers] = useRecoilState(catPrayersState);

    // on initial render, whenever the signed in state changes, or if there's a session expiration,
    // this hook checks which of the prayers in the app have been favorited by the current user. 
    // if the user is signed out this will run but nothing happens in the function itself and it returns
    // an empty array.
    useEffect(() => {
        setUpFavorites().then((thePrayers) => {
            setFavoritePrayers(thePrayers);
        });
    }, [isSignedIn, sessionSwitch]);

    // on initial render, whenever the signed in state changes, or if there's a session expiration,
    // this hook checks and verifies the sign in state, so that only the sign in button is displayed
    // if the user is not signed in any more.
    useEffect(() => {
      isUserSignedIn().then((value) => {
        setIsSignedIn(value);
      })
    }, [isSignedIn, sessionSwitch, currentlySignedIn]);


    //----------------------------------------
    // FUNCTIONS
    //----------------------------------------


    // this function checks if the user is currently signed in. because this is async, may want to
    // think about preventing user button pushes if this logic takes a while. but may not be an issue.
    async function isUserSignedIn() {
      const isSignedIn = await GoogleSignin.isSignedIn();
      return isSignedIn;
    };

    // this function checks which of the prayers of the app have been favorited by the current user.
    // then it builds an array of jsx elements of the favorited prayers and displays them in the 
    // interface's scrollview.
    async function setUpFavorites() {
        let isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn == false) {
            return [];
        } else {
          console.log('setting up favorites');
          // get prayers from state

          let thePrayerObjs = catPrayers.prayerObjects;

          let thePrayers = thePrayerObjs.filter((obj) => {
            return obj.isFavorite;
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
    }

    // this function biulds the prayer element for the above generated array of jsx elements that are 
    // displayed in the scrollview
    const buildPrayerElement = (prayerId, prayerTitle, prayerUrl, prayerText, isFavorite, favoriteId) => {
        return (
          <View key={prayerId} style={styles.prayerContainerBuffer}>
            <Prayer id={prayerId} title={prayerTitle} url={prayerUrl} text={prayerText} 
            isFavorite={isFavorite} favoriteId={favoriteId}></Prayer>
          </View>
        )
    }

    // this function for the above setUpFavorites function takes the favorites gotten from the
    // db and formats them into an array of objects that are easy to work with in the subsequent
    // logic of the setUpFavorites function
    function getFavorites(theFavoritesGot) {

     let theFavorites = theFavoritesGot;
      let favoritePrayerObjs = [];

      if (theFavorites.length > 0) {
        for (let i of theFavorites) {
          let theFavoriteId = i.id;
          let thePrayer = i.get('Prayer');
          let thePrayerId = thePrayer.id;
          
          let obj = {
            favoriteId: theFavoriteId,
            prayerId: thePrayerId
          }

          favoritePrayerObjs.push(obj);
        }
      }

      return favoritePrayerObjs;
      
    }

    // this function simply gets the current user.
    const getCurrentUser = async function () {
        const currentUser = await Parse.User.currentAsync();
        return currentUser;
    }

    // this function simply logs in the user if the user pushes the sign in button
    const doUserLogInGoogle = async function () {
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


              setIsSignedIn(true);
              return true;
            })
            .catch(async (error) => {
              // Error can be caused by wrong parameters or lack of Internet connection
              Alert.alert('Error 2!', error.message);
              return false;
            });
        } catch (error) {
          Alert.alert('Error 1!', error.message);
          return false;
        }
      }

      // this function signs out the user if the user pushes the sign out button
      const signOut = async () => {
        try {
          await GoogleSignin.signOut();
          await Parse.User.logOut();
          // To verify that current user is now empty, currentAsync can be used
          const currentUser = await Parse.User.currentAsync();
          if (currentUser === null) {
            // alert('Success! No user is logged in anymore!');
          }

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

          setFavoritePrayers((old) => { return []; });
          setIsSignedIn(false);
        } catch (error) {
          console.error(error);
        }
        
      };

      // this function signs out the user by calling the above function and also sets state for 
      // session switch to be toggled. this isnt actually a session expiration, but the other 
      // components in the app need to know that a sign out has occurred so they stop displaying
      // favorites data. toggling the sessionswitch achieves this so no need for another variable.

      // the reason this function exists is because wrapping the "setIsSigned" state call and then
      // calling state here directly with "setSessionSwitch" allows for two state calls in a row,
      // something normally not possible in react. this trick could be replaced by passing a function
      // as the argument for both state calls, which is what is recommended to achieve this behavior.
      const signOutButton = async () => {
        await signOut();
        setSessionSwitch(!sessionSwitch);
      };


    //----------------------------------------
    // THE INTERFACE
    //----------------------------------------


    return (
        <View style={styles.container}>
            <View style={{height: Dimensions.get('window').height*.009}}></View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} 
                  onPress={() => navigation.navigate('PrayerCategories')}>
                    <Text style={styles.backButtonText}>Back to Prayer Categories</Text>
                </TouchableOpacity>
            </View>
            { 
                isSignedIn
                ? 
                <View style={styles.listContainer}>
                    <ScrollView>
                        <View key="signoutbuttonview" style={styles.signOutButtonContainer}>
                            <TouchableOpacity style={styles.button} 
                              onPress={signOutButton}>
                                <Text style={styles.backButtonText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                        {favoritePrayers}
                    </ScrollView>
                </View>
                :
                <View style={styles.signInContainer}>
                    <GoogleSigninButton
                        style={{ width: 192, height: 48 }}
                        size={GoogleSigninButton.Size.Wide}
                        color={GoogleSigninButton.Color.Light}
                        onPress={doUserLogInGoogle}
                        />
                </View>
            }
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
    signOutButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    listContainer: {
      flex: 21,
      justifyContent: 'flex-start'
    },
    signInContainer: {
        flex: 17,
        justifyContent: 'center',
        alignItems: 'center'
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

export default Favorites;