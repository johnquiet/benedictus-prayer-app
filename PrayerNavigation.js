import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PrayerCategories from './PrayerCategories.js';
import Pray from './Pray.js';
import RosaryPray from './RosaryPray.js';
import Parse from "parse/react-native.js";
import Favorites from './Favorites.js';
import { useRecoilState } from 'recoil';
import { didSignOutState, sessionSwitchState } from './AlarmState.js';


//----------------------------------------
//----------------------------------------
// THE PRAYERNAVIGATION COMPONENT
//----------------------------------------
//----------------------------------------


// this component contains the navigation structure for all of the components that are rendered
// while the user is using the prayer tab. the component initially rendered is PrayerCategories.js, 
// but depending on what category the user clicks on a list view of prayers (Pray.js) will be 
// rendered.

const Stack = createNativeStackNavigator();

const PrayerNavigation = () => {


  //----------------------------------------
  // STATE VARIABLES
  //----------------------------------------


  // this local variable contains an array of jsx elements, each one of the type Stack.Screen. one jsx 
  // element for each category that the db provided to the app on app launch. the name of each jsx element
  // is the category id from the db for the category.
  const [screens, setScreens] = useState([]);

  // if the user has previously installed the app on their phone, then uninstalls it, and then installs
  // it again, their old session will be invalid. this will throw an error on first app launch and the
  // app won't work until a sign out occurs. so on the very first time the app launches, it must automatically
  // do a sign out just in case. this variable keeps track of whether that has happened yet.
  const [didSignOut, setDidSignOut] = useRecoilState(didSignOutState);

  // this is a global state variable, a boolean that is toggled every time there is an error
  // going to the DB due to session expiration. most components track this.
  const [sessionSwitch, setSessionSwitch] = useRecoilState(sessionSwitchState);

  // on initial render, on initial app launch sign out, or on session error, this hook gets all prayer categories
  // from the db and builds jsx elements so that a screen for each is added to the navigation structure.
  useEffect(() => {
    getCategories().then((value) => {
      setScreens(value);
    });
  }, [didSignOut, sessionSwitch]);

  
  //----------------------------------------
  // FUNCTIONS
  //----------------------------------------


  // on render of the prayer navigation component it gets all prayer categories and builds a jsx 
  // screen element for each so that those screens are in the navigation structure and accessible 
  // to the category buttons in PrayerCategories.js
  async function getCategories() {
    const catQuery = new Parse.Query('PrayerCategories');
    let categories = await catQuery.find();

    let navElements = [];

    for (let i of categories) {
      let navElement = buildNavElement(i.id);
      navElements.push(navElement);
    }

    return navElements;
  }

  const buildNavElement = (catId) => {
    return <Stack.Screen key={catId} name={catId} component={Pray} />
  }


  //----------------------------------------
  // THE INTERFACE
  //----------------------------------------


  return (
      <Stack.Navigator initialRouteName="PrayerCategories" screenOptions={{
          headerShown: false
        }}>
          <Stack.Screen name="PrayerCategories" component={PrayerCategories} />
          <Stack.Screen name="Favorites" component={Favorites} />
          {screens}

      </Stack.Navigator>
  );
}
  
export default PrayerNavigation;