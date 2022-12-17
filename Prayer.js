import React, { useState, useCallback, useRef, useEffect } from "react";
import { Alert, ActivityIndicator, ToastAndroid, Image, ScrollView, Dimensions, View, Switch, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AudioSlider from './AudioSlider.js';
import { useFonts } from 'expo-font';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import Parse from "parse/react-native.js";
import favorited from './assets/favorited.png';
import notFavorited from './assets/notfavorited.png';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { favoritesState, sessionSwitchState, currentlySignedInState, catPrayersState } from './AlarmState.js';
import { useRecoilState } from 'recoil';


//----------------------------------------
//----------------------------------------
// THE PRAYER COMPONENT
//----------------------------------------
//----------------------------------------


// this component contains and renders an individual prayer (title, audio and text). this component
// is usually rendered many times in Pray.js for each prayer belonging to a given prayer category.

const Prayer = (props) => {


    //----------------------------------------
    // STATE VARIABLES
    //----------------------------------------


    // this variable is local and neither read nor set so it can probably be deleted at some point
    const [prayer, setPrayer] = useState({
        id: '',
        name: '',
        url: '',
        words: '',
        hasWords: false,
        category: '',
        gotPrayer: false
    });

    // this variable keeps track of whether the user has pushed the expand (+) button to show the
    // text of the prayer or not
    const [showWords, setShowWords] = useState(false);

    // this variable is only relevant when the given prayer is being rendered in Favorites.js. when
    // a user unfavorites this prayer, if the prayer is being displayed in Favorites.js, it is removed
    // from this global array of jsx elements immediately so that the prayer disappears from the favorites
    // screen even though no db call has been made.
    const [favoritePrayers, setFavoritePrayers] = useRecoilState(favoritesState);

    // this is a global state variable, a boolean that is toggled every time there is an error
    // going to the DB due to session expiration. most components track this.
    const [sessionSwitch, setSessionSwitch] = useRecoilState(sessionSwitchState);

    // this variable is global but neither read nor set so it can probably be deleted at some point
    const [currentlySignedIn, setCurrentlySignedIn] = useRecoilState(currentlySignedInState);

    // this local boolean keeps track of whether the prayer is favorited or not. because this is tracked
    // locally first it allows for immediate updates to the ui while the async db logic is still running
    const [prayerIsFavorite, setPrayerIsFavorite] = useState(false);

    // when the app launches this global variable gets set with all of the prayer categories
    // and all of the prayers for the app. this makes for fast loading every where else just a single
    // db call on app launch.
    const [catPrayers, setCatPrayers] = useRecoilState(catPrayersState);

    const [favId, setFavId] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    // on first render set prayerIsFavorite to true if that's what the parent says
    useEffect(() => {
        setPrayerIsFavorite(props.isFavorite);
    }, []);

    useEffect(() => {
        setFavId((old) => { return props.favoriteId; });
    }, []);

    
    //----------------------------------------
    // FUNCTIONS
    //----------------------------------------


    // show or hide the words if the user pushes the + or - button
    const showHideWords = () => {
        setShowWords(!showWords);
    }

    // get the current user. this is called in addFavorite(). if it's null then the user is not signed
    // in and favorite will not but added even if the user clicks the button. the user will be directed
    // via toast to sign in.
    const getCurrentUser = async function () {
        const currentUser = await Parse.User.currentAsync();
        return currentUser;
    }

    // set local tracker of whether prayer is favorited to true so ui immediately updates, no need to
    // wait for the db to tell us what we already know.
    const isFavorite = () => {
        setPrayerIsFavorite(true);
    }

    // set local tracker of whether prayer is unfavorited to false so ui immediately updates, no need to
    // wait for the db to tell us what we already know.
    const isNotFavorite = () => {
        setPrayerIsFavorite(false);
    }

    // the user favorites a prayer. creates a new favorite record in the db which contains user id and prayer id
    // foreign keys (pointers). acl security is set so users could never update each others data. if user
    // tries to add fav while not signed in toast will direct user to sign in. local state for is favorite
    // will be set to true for immediate ui update.
    async function addFavorite() {
        if (prayerIsFavorite == false) {
            setIsLoading((l) => { return true; });
            let currentUser = await getCurrentUser();
            if (currentUser !== null) {
                let currentUserId = currentUser.id;
                let favorite = new Parse.Object('Favorites');
                favorite.set('Prayer', { "__type": "Pointer", "className": "Prayers", "objectId": props.id });
                favorite.set('User', { "__type": "Pointer", "className": "_User", "objectId": currentUserId });
                favorite.setACL(new Parse.ACL(currentUser));

                try {
                    await favorite.save();
                    
                    // now go and get the id of the newly created favorite record.

                    const favoriteQuery = new Parse.Query('Favorites');
                    favoriteQuery.equalTo('User', { "__type": "Pointer", "className": "_User", "objectId": currentUserId });
                    favoriteQuery.includeAll();

                    let theFavorites = await favoriteQuery.find();

                    // find the favorite record for this prayer

                    let relevantFavorite = [];

                    relevantFavorite = theFavorites.filter((value) => {
                      return value.get('Prayer').id == props.id;
                    });

                    

                    if (relevantFavorite.length > 0) {
                      let newFavId = relevantFavorite[0].id;

                      // update state 

                      let newCatPrayersObjs = catPrayers.prayerObjects.map((i) => {
                        if (props.id == i.id) {
                          return {
                            id: i.id,
                            title: i.title,
                            url: i.url,
                            text: i.text,
                            category: i.category,
                            isFavorite: true,
                            favoriteId: newFavId
                          }
                        } else {
                          return i;
                        }
                      });

                      setCatPrayers((old) => { 
                        return { 
                          categoryElements: old.categoryElements, 
                          prayerObjects: newCatPrayersObjs  
                        }; 
                      });

                      setFavId((old) => { return newFavId; });
                      setPrayerIsFavorite((old) => { return true; })
                      let newFavEl = buildPrayerElement(props.id, props.title, props.url, props.text, true, newFavId);
                      setFavoritePrayers((oldFavs) => [...oldFavs, newFavEl]);
                    }
                    setIsLoading((l) => { return false; });

                    
                } catch (error) {
                    // Error can be caused by lack of Internet connection
                    console.log(error);
                    await signOut();
                    ToastAndroid.show("Login expired. Go to Favorites and Sign In!", ToastAndroid.SHORT);
                    setSessionSwitch((s) => { return !s; });
                    setIsLoading((l) => { return false; });
                    return false;
                };
            } else {
                ToastAndroid.show("Go to Favorites and sign In!", ToastAndroid.SHORT);
                setIsLoading((l) => { return false; });
            }
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

    // the user unfavorites a prayer. the favorite record will be deleted from the db. local state
    // for is favorite will be set to false for immediate ui update. additionally the prayer will
    // be removed from the global array of jsx favorite elements, which will make the prayer comp
    // disappear from the ui if this prayer is being displayed on Favorites.js screen.
    async function deleteFavorite() {
        setIsLoading((l) => { return true; });
        let favoriteToDelete = new Parse.Object('Favorites');
        favoriteToDelete.set('objectId', favId);
        try {
            await favoriteToDelete.destroy();
            // Refresh todos list to remove this one
            // setUpdatedFavoriteSwitch(!updatedFavoriteSwitch);

            // update state
            let newCatPrayersObjs = catPrayers.prayerObjects.map((i) => {
              if (props.id == i.id) {
                return {
                  id: i.id,
                  title: i.title,
                  url: i.url,
                  text: i.text,
                  category: i.category,
                  isFavorite: false,
                  favoriteId: ''
                }
              } else {
                return i;
              }
            });

            setCatPrayers((old) => { 
              return { 
                categoryElements: old.categoryElements, 
                prayerObjects: newCatPrayersObjs  
              }; 
            });

            setPrayerIsFavorite((old) => { return false; });
            setFavId((old) => { return ''; })
            setIsLoading((l) => { return false; });
          } catch (error) {
            // Error can be caused by lack of Internet connection
            console.log(error);
            await signOut();
            ToastAndroid.show("Login expired. Go to Favorites and Sign In!", ToastAndroid.SHORT);
            setSessionSwitch((s) => { return !s; });
            setIsLoading((l) => { return false; });
            return false;
          };

        let favoriteElements = favoritePrayers;
        console.log('length of favoriteElements: ' + favoriteElements.length);
        let newFavoriteElements = favoriteElements.filter((element) => {
            console.log('element key: ' + element.key);
            console.log('prayer id: ' + props.id);
            return element.key != props.id;
        });
        console.log('length of new favoriteElements: ' + newFavoriteElements.length);
        setFavoritePrayers((oldFavs) => { return newFavoriteElements; });
    }

    // this function signs out the user. the reason this function is here even though this screen
    // does not have a sign out button is because a sign out is necessary if a session expiration 
    // happens while the user is using the app. this function is called anywhere db error handled in that
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

        } catch (error) {
          console.error(error);
        }
        
    }


    //----------------------------------------
    // THE INTERFACE
    //----------------------------------------


    return (
        <View>
            {
              !isLoading ? 
              <View style={styles.prayerTitleContainer}>
                  <Text style={styles.prayerTitleText}> &nbsp;{props.title}</Text>
                  {
                      prayerIsFavorite
                      ? 
                      <TouchableOpacity onPress={deleteFavorite} style={styles.favoriteButton}>
                          <Image source={favorited} style={styles.sizeDown}></Image>
                      </TouchableOpacity> 
                      : 
                      <TouchableOpacity onPress={addFavorite} style={styles.favoriteButton}>
                          <Image source={notFavorited} style={styles.sizeDown}></Image>
                      </TouchableOpacity>
                  }
              </View> :
              <View style={styles.prayerTitleContainer}>
                  <Text style={styles.prayerTitleText}> &nbsp;{props.title}</Text>
                  <TouchableOpacity style={styles.favoriteButton}>
                    <ActivityIndicator size="small" color="#a7e7fa" />
                  </TouchableOpacity> 
              </View>
            }
            <AudioSlider audio={{uri: props.url}}/>
            
            {
                showWords ? 
                <View style={styles.prayerTextContainer}>
                    <TouchableOpacity style={styles.redButton} onPress={showHideWords}><Text style={styles.buttonText}>-</Text></TouchableOpacity>
                    <Text style={styles.prayerWordsText}>{props.text}</Text>
                </View> :
                <View style={styles.prayerTextContainer}>
                    <TouchableOpacity style={styles.blueButton} onPress={showHideWords}><Text style={styles.buttonText}>+</Text></TouchableOpacity>
                </View>
            }

        </View>
    );
}


//----------------------------------------
//----------------------------------------
// STYLES
//----------------------------------------
//----------------------------------------


const styles = StyleSheet.create({
    prayerTitleText: {
        fontSize: RFPercentage(2),
        fontFamily: 'monospace',
        textAlignVertical: 'center',
        color: '#ffffff',
        marginBottom: Dimensions.get('window').height*.01,
        lineHeight: RFPercentage(5)
      },
      favoriteButton: {
        backgroundColor: '#1D1D1D',
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        height: (Dimensions.get('window').height*.06),
        width: (Dimensions.get('window').height*.06)
      },
      prayerTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
      },
      sizeDown: {
        transform: [
          {scaleX: (Dimensions.get('window').height/14000)},
          {scaleY: (Dimensions.get('window').height/14000)}
        ]
      },
      prayerTextContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Dimensions.get('window').height*.02,
        marginTop: Dimensions.get('window').height*.01
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
      prayerWordsText: {
        fontSize: RFPercentage(1.8),
        fontFamily: 'monospace',
        textAlign: 'center',
        textAlignVertical: 'center',
        color: '#ffffff',
        marginBottom: Dimensions.get('window').height*.01,
        marginTop: Dimensions.get('window').height*.03,
        lineHeight: RFPercentage(5),
        width: Dimensions.get('window').width*.96
      }
});

export default Prayer;