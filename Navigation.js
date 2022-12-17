import * as React from 'react';
import { Text, View, Image, StyleSheet, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import Home from './Home.js';
import PrayerNavigation from './PrayerNavigation.js';
import Profile from './Profile.js';
import Search from './Search.js'
import alarm from './assets/alarm.png';
import pray from './assets/pray.png';
import profile from './assets/profile.png';
import logo from './assets/freepraylogo.png';
import search from './assets/search.png';


//----------------------------------------
//----------------------------------------
// THE NAVIGATION COMPONENT
//----------------------------------------
//----------------------------------------


// this component contains the tab navigator that can be seen at the bottom of the app at all times as well
// as the header logo that is always at the top of the app. the only non default setting in the 
// navigator is that the loading of the tabs is NOT Lazy. so as soon as the app launches all 4 
// tabs render. this does not affect performance and allows the prayer tab to fetch the prayers
// as soon as the app launches.

const Tab = createBottomTabNavigator();

const Navigation = () => {


  //----------------------------------------
  // THE INTERFACE
  //----------------------------------------


  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarHideOnKeyboard: true,
          headerTitle: (props) => <Logo />,
          headerStyle: {
            backgroundColor: '#2e2e2e',
            height: Dimensions.get('window').height*.15,
          },
          tabBarIcon: ({ focused, color, size }) => {

            if (route.name === 'Home') {
                return <Image source={alarm} style={styles.sizeDown}></Image>
            } else if (route.name === 'PrayerNavigation') {
                return <Image source={pray} style={styles.sizeDown}></Image>
            } else if (route.name === 'Profile') {
                return <Image source={profile} style={styles.sizeDown}></Image>
            } else if (route.name === 'Search') {
              return <Image source={search} style={styles.sizeDown}></Image>
          }

          },
          tabBarActiveTintColor: 'gray',
          tabBarInactiveTintColor: 'gray',
          headerShown: true,
          tabBarShowLabel: false,
          tabBarActiveBackgroundColor: '#525252',
          tabBarInactiveBackgroundColor: '#2e2e2e',
          tabBarStyle: {
            height: Dimensions.get('window').height*.13,
            borderTopWidth: 0
          },
          lazy: false
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="PrayerNavigation" component={PrayerNavigation} />
        <Tab.Screen name="Search" component={Search} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}


//----------------------------------------
//----------------------------------------
// HELPER FUNCTIONS
//----------------------------------------
//----------------------------------------


//----------------------------------------
// BUILD THE LOGO HEADER
//----------------------------------------


// this function builds the logo for the header to show at all times in the app. 

function Logo() {
  return (
    <View style={styles.logoContainer}>
      <Image source={logo} style={styles.sizeDownLogo}></Image>
    </View>
  )

}


//----------------------------------------
//----------------------------------------
// STYLES
//----------------------------------------
//----------------------------------------


const styles = StyleSheet.create({
    sizeDown: {
      transform: [
        {scaleX: (Dimensions.get('window').height/10000)},
        {scaleY: (Dimensions.get('window').height/10000)}
      ]
    },
    sizeDownLogo: {
      transform: [
        {scaleX: Dimensions.get('window').width/1000},
        {scaleY: Dimensions.get('window').height/2000}
      ],
      
    },
    logoContainer: {
      justifyContent: 'center',
      alignItems: 'center'
    }
  });

export default Navigation;