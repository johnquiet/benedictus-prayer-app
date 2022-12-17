import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, ShadowPropTypesIOS, Text, View, Dimensions } from 'react-native';
import AlarmListItem from './AlarmListItem.js';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useFonts } from 'expo-font';


//----------------------------------------
//----------------------------------------
// THE ALARMLIST COMPONENT
//----------------------------------------
//----------------------------------------


// this component contains the list of all alarms (whether on or off) that have been created by the 
// user. the alarms come directly from the timesPicked state array in App.js which is passed down in
// the appsToAlarmList prop.

const AlarmList = (props) => {


  //----------------------------------------
  // VARIABLES
  //----------------------------------------


  // declare variable storing alarms interace components to be displayed on this render
  let alarmsMapped;
   

  //----------------------------------------
  // THE USER TURNS AN ALARM ON OR OFF
  //----------------------------------------

  // this function is passed down to AlarmListItem as a prop. AlarmListItem.js calls it when the user 
  // turns an alarm on or off, and passes up here the alarmObject argument which is the alarm object 
  // for the alarm that is being turned on or off. then, this function passes the alarm object in 
  // question up to App.js to either schedule a new notification ("turning on" switchListToApp) and
  // update the array with an alarm of property switch: true OR to simply update the array with 
  // with an alarm of property switch: false and undefined nId (notification got canclled in AlarmListItem)
  // ("turning off" switchListToAppUpdate)

  const switchToList = (alarmObject) => {

    if (alarmObject.switch) {

      // if alarm was turned on call App.js function that schedules notification and updates switch to
      // true
      props.switchListToApp(alarmObject);

    } else {

      // if alarm was turned on call App.js function that simply updates updates switch to false
      props.switchListToAppUpdate(alarmObject);
    }
  }


  //----------------------------------------
  // THE USER DELETES AN ALARM
  //----------------------------------------


  // this function is passed to AlarmListItem as a prop. AlarmListItem.js then calls it and passes up
  // the itemKeyToDelete argument which is the id of the alarm that should be deleted from the timesPicked
  // state array in App.js. the associated notification was already cancelled in AlarmListItem.js.
  // this function then passes up the id to App.js so it can be deleted from the array

  const itemToList = (itemKeyToDelete) => {

    //pass the id of the alarm to be deleted up to App.js where it will be deleted
    props.alarmListToAppDelete(itemKeyToDelete);

  }


  //----------------------------------------
  // THE USER EDITS AN ALARM
  //----------------------------------------


  // this function is passed down to AlarmListItem as a prop. AlarmListItem.js calls it and passes
  // up the accessKeyObject argument which is an object corresponding to the state object in 
  // App.js, showEditPicker. accessKeyObject will always have a property show: true since the goal of
  // this function is to show the edit time picker. this function passes up the object to App.js
  // which will setShowEditPicker in state. TimePicker.js will respond by showing the edit picker. 

  const editToList = (accessKeyObject) => {
    // pass the object up to App.js which will let TimePicker.js know to show edit picker
    props.changeEditVis(accessKeyObject);
  }

  //--------------------------------------------------------------
  // ON RENDER, BUILD ARRAY OF ALARMLISTITEMS TO SHOW IN INTERFACE
  //--------------------------------------------------------------

  // as long as the user has at least one existing alarm,
  // the code below takes the array received in the prop appToAlarmList (which is directly from
  // timesPicked state array in App.js), makes a copy of it, sorts it by time of day (earliest first),
  // and then replaces each element of the new array with JSX to show that element on the screen. 
  
  if (props.appToAlarmList.length > 0) {

    alarmsMapped = [].concat(props.appToAlarmList)
                        .sort((a, b) => (a.time.getHours()*60 + a.time.getMinutes()) > (b.time.getHours()*60 + b.time.getMinutes()) ? 1 : -1)
                        .map((item, i) => 
                          <View key={item.id}>
                            <AlarmListItem accessKey={item.id} 
                                notifId={item.nId} time={item.alarmTime} 
                                editToList= {editToList} itemToList={itemToList} 
                                switchToList={switchToList} alarmObject={item}></AlarmListItem>
                            <Text>&nbsp;</Text>
                          </View>
                        );
  } else {
    alarmsMapped = [];
  }
  

  //----------------------------------------
  // INTERFACE
  //----------------------------------------


  // above its saying get hours isn't a method. so check the type of the prop array's elements make sure is date
  return (
    <View style={styles.container}>
      { alarmsMapped.length > 0 &&
        <ScrollView>{alarmsMapped}</ScrollView>
      }
      { alarmsMapped.length == 0 &&
        <Text style={styles.quote}>
           "As therefore the idea of time consists in the numbering of before and after in movement; 
           so likewise in the apprehension of the uniformity of what is outside of movement, 
           consists the idea of eternity." {"\n"} {"\n"}

           - St. Thomas Aquinas
        </Text>
      }
    </View>
  );
};


//----------------------------------------
//----------------------------------------
// STYLES
//----------------------------------------
//----------------------------------------


const styles = StyleSheet.create({
  container: {
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

export default AlarmList;