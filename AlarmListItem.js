import React, { useState } from 'react';
import { Image, ScrollView, Dimensions, View, Switch, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useFonts } from 'expo-font';
import edit from './assets/edit.png';
import deleteAlarm from './assets/deleteAlarm.png';


//----------------------------------------
//----------------------------------------
// THE ALARMLISTITEM COMPONENT
//----------------------------------------
//----------------------------------------


// this component contains the on/off switch, the alarm time, the edit button, and the delete button
// for a given alarm in the timesPicked state array in App.js

const AlarmListItem = (props) => {

    //----------------------------------------
    // THE USER TURNS THE ALARM ON OR OFF
    //----------------------------------------


    // this function is called when the user turns the alarm on or off via the onValueChange prop of 
    // of the switch. if the alarm has been turned off the associated scheduled notification will be
    // cancelled using the notifId prop passed down from AlarmList. regardless, the function then 
    // passes up a new alarm object with the opposite value for the switch property. this object will
    // end up replacing the old one in timesPicked state array in App.js and then the change will
    // propagate down to children and the interface

    const newToggleSwitch = () => {

        // if the alarm was turned off cancel the alarm's notfication
        if (props.alarmObject.switch) {
            cancelNotification(props.notifId);
        }

        // pass up the new turned off alarm object to replace the old in App.js
        props.switchToList({id: props.alarmObject.id, 
                            time: props.alarmObject.time,
                            switch: !props.alarmObject.switch,
                            alarmTime: props.alarmObject.alarmTime
                            });
    }


    //----------------------------------------
    // THE USER DELETES THE ALARM
    //----------------------------------------


    // this function is called when the user presses the alarm's delete button. 
    // it passes up the id of the alarm to be deleted, so that ultimately, App.js can delete from 
    // the times picked state Array. then this function cancels the alarm's notification.

    const onPress = () => {
        // pass up to delete from interface
        props.itemToList(props.accessKey);
        // delete scheduled notification
        cancelNotification(props.notifId);
    }


    //----------------------------------------
    // THE USER PRESSES THE EDIT BUTTON
    //----------------------------------------

    // this function is called when the user presses the edit button. it passes an object 
    // corresponding to state object showEditPicker in App.js up to parent so that ultimately
    // App.js will replace the current showEditPicker object with one where the show property
    // is true. this change propagates down to TimePicker and the edit picker is shown with the 
    // right alarm in mind
    
    const onPressEdit = () => {
        //call function in alarmlist passed through parameters
        let accessKeyObject = {id: props.accessKey, show: true, nId: props.notifId}
        props.editToList(accessKeyObject);
    }


    //----------------------------------------
    // THE INTERFACE
    //----------------------------------------


    return (
        <View style={styles.container}>
            <Switch
                trackColor={{ false: '#767577', true: '#324b52' }}
                thumbColor={props.alarmObject.switch ? '#a7e7fa' : '#444544'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={newToggleSwitch}
                value={props.alarmObject.switch} style={styles.sizeUp}
            />
            <Text style={styles.text}>{props.time}</Text>
            <TouchableOpacity onPress={onPressEdit} style={styles.blueButton}>
                <Image source={edit} style={styles.sizeDown}></Image>
            </TouchableOpacity>
            <TouchableOpacity style={styles.redButton} onPress={onPress}>
                <Image source={deleteAlarm} style={styles.sizeDown}></Image>
            </TouchableOpacity>
        </View>
    );

};

    
//----------------------------------------
//----------------------------------------
// HELPER FUNCTIONS
//----------------------------------------
//----------------------------------------


//----------------------------------------
// CANCEL NOTIFICATION
//----------------------------------------


// this function cancels the notification of an alarm with given nId. called in onPress() above 

async function cancelNotification(notifId) {
    await Notifications.cancelScheduledNotificationAsync(notifId).then(
                                                                        (value) => {
                                                                            
                                                                        },
                                                                        (error) => {}
                                                                    );
}


//----------------------------------------
//----------------------------------------
// STYLES
//----------------------------------------
//----------------------------------------
  

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        width: (Dimensions.get('window').width*.99),
        justifyContent: 'space-around',
        flex: 1
    },
    text: {
        fontSize: RFPercentage(4.5),
        fontFamily: 'monospace',
        color: '#dbd9d9'
    },
    darkText: {
        fontSize: RFPercentage(2.6),
        fontFamily: 'monospace',
        color: '#292828'
    },
    redButton: {
        backgroundColor: '#f77e7e',
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        height: (Dimensions.get('window').height*.06),
        width: (Dimensions.get('window').height*.06)
    },
    blueButton: {
        backgroundColor: '#a7e7fa',
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        height: (Dimensions.get('window').height*.06),
        width: (Dimensions.get('window').height*.06)
    },
    sizeUp: {
        transform: [
            { scaleX: (Dimensions.get('window').width/220) }, 
            { scaleY: (Dimensions.get('window').height/450) }
        ]
    },
    sizeDown: {
      transform: [
        {scaleX: (Dimensions.get('window').height/14000)},
        {scaleY: (Dimensions.get('window').height/14000)}
      ]
    }
  });

export default AlarmListItem;