import React, { useState } from 'react';
import {Dimensions, Pressable, TouchableOpacity, Modal, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useFonts } from 'expo-font';
import { useRecoilState } from 'recoil';
import { snoozeModalState } from './AlarmState.js';


//----------------------------------------
//----------------------------------------
// THE PERMISSIONSMODAL COMPONENT
//----------------------------------------
//----------------------------------------

// when the user launches the app for the first time, the system will prompt them to give permission
// for notifications. however, if they deny that system prompt will never appear again. so if the 
// app launches again, we need to show this modal asking the user to go to settings and allow 
// notifications, otherwise the app won't work

const SnoozeModal = (props) => {

    

    const [showSnoozeModal, setShowSnoozeModal] = useRecoilState(snoozeModalState);


    //------------------------------------------------
    // THE USER CLOSES THE MODAL
    //------------------------------------------------


    // this function closes the modal if the user presses the close button

    const hideModal = () => {
        setShowSnoozeModal(false);
    }


    //------------------------------------------------
    // THE INTERFACE
    //------------------------------------------------


    return (
        
            <Modal
                animationType="slide"
                transparent={true}
                visible={showSnoozeModal}
                onRequestClose={hideModal}>
                <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>
                        FreePray will remind you to pray in five minutes!
                    </Text>
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
      fontFamily: 'monospace'
    },
    modalText: {
      marginBottom: RFPercentage(1.9),
      fontFamily: 'monospace',
      fontSize: RFPercentage(1.6),
      textAlign: 'center',
      lineHeight: RFPercentage(3.1)
    },
  });

export default SnoozeModal;