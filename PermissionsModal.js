import React, { useState } from 'react';
import {Dimensions, Pressable, TouchableOpacity, Modal, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useFonts } from 'expo-font';


//----------------------------------------
//----------------------------------------
// THE PERMISSIONSMODAL COMPONENT
//----------------------------------------
//----------------------------------------

// when the user launches the app for the first time, the system will prompt them to give permission
// for notifications. however, if they deny that system prompt will never appear again. so if the 
// app launches again, we need to show this modal asking the user to go to settings and allow 
// notifications, otherwise the app won't work

const PermissionsModal = (props) => {

    

    //------------------------------------------------
    // THE USER GOES TO SETTINGS TO ENABLE PERMISSIONS
    //------------------------------------------------

    // this function takes the user to settings for the app

    const goToSettings = () => {
        Linking.openSettings();
    }


    //------------------------------------------------
    // THE USER CLOSES THE MODAL
    //------------------------------------------------


    // this function closes the modal if the user presses the close button.
    // this function passes up a false boolean to App.js which will then change the state boolean
    // which is passed down here to the visible prop of Modal -- and hide the modal.

    const hideModal = () => {
        props.changePermVis(false);
    }


    //------------------------------------------------
    // THE INTERFACE
    //------------------------------------------------


    return (
        
            <Modal
                animationType="slide"
                transparent={true}
                visible={props.showPermissionsModal}
                onRequestClose={hideModal}>
                <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>
                        Welcome to FreePray!
                    </Text>
                    <Text style={styles.modalText}>
                        When you set a prayer reminder, the app will remind you to pray at the time 
                        you specify.
                    </Text>
                    <Text style={styles.modalText}>
                        If you haven't given us permission to send you notifications already, please
                        go to settings below and enable notifications for this app.
                    </Text>
                    <Text style={styles.modalText}>
                        Check out the prayer tab for prayers and prayer recordings!
                    </Text>
                    <Text style={styles.modalText}>
                        God bless you!
                    </Text>
                    <Text> </Text>
                    <Pressable
                    style={[styles.button, styles.buttonBlue]}
                    onPress={goToSettings}>
                        <Text style={styles.textStyle}>Go to Settings</Text>
                    </Pressable>
                    <Text> </Text>
                    <Pressable
                    style={[styles.button, styles.buttonRed]}
                    onPress={hideModal}>
                    <Text style={styles.textStyle}>Close</Text>
                    </Pressable>
                </View>
                </View>
            </Modal>
    );
};


//----------------------------------------
//----------------------------------------
// STYLES
//----------------------------------------
//----------------------------------------


const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },
    modalView: {
      margin: 20,
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    button: {
      borderRadius: 8,
      padding: (Dimensions.get('window').height*.03),
      elevation: 2,
    },
    buttonRed: {
      backgroundColor: '#f77e7e',
    },
    buttonBlue: {
      backgroundColor: '#a7e7fa',
    },
    textStyle: {
      color: '#292828',
      textAlign: 'center',
      fontFamily: 'monospace',
      fontSize: RFPercentage(2)
    },
    modalText: {
      marginBottom: RFPercentage(1.5),
      fontFamily: 'monospace',
      textAlign: 'center',
      fontSize: RFPercentage(2),
      lineHeight: RFPercentage(3.5)
    },
  });

export default PermissionsModal;