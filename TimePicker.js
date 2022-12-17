import React, { useState, useEffect } from "react";
import { Button, Image,View, StyleSheet, TouchableOpacity, Text, Dimensions } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Notifications from "expo-notifications";
import stop from './assets/stop.png';
import snooze from './assets/snooze.png';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useFonts } from 'expo-font';
import { useRecoilState } from 'recoil';
import { snoozeModalState } from './AlarmState.js';
import SnoozeModal from './SnoozeModal.js';


//----------------------------------------
//----------------------------------------
// THE TIMEPICKER COMPONENT
//----------------------------------------
//----------------------------------------


// this component contains the date time picker that the user uses to pick when they want their alarm
// to go off whether they are creating an alarm or editing one

const TimePicker = (props) => {


  //----------------------------------------
  // STATE VARIABLES
  //----------------------------------------


  // this state boolean determines if the time picker used to create a new alarm is visible
  // via the isVisible prop there are two time pickers, one for creation and one for editing an alarm.
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // this state date object contains the default value of the time pickers when they are opened
  // this will always equal the date time of when the user opened the time picker
  const [pickerValue, setPickerValue] = useState(new Date());

  const [showSnoozeModal, setShowSnoozeModal] = useRecoilState(snoozeModalState);


  //------------------------------------------------------------------------------
  // UPDATE THE TIME PICKERS' DEFAULT VALUE EVERYTIME THE USER OPENS A TIME PICKER
  //------------------------------------------------------------------------------


  // call useEffect with the argument [isDatePickerVisible, props.showEditPicker.show] so that every
  // time those values change (which determine the visibility of the create time picker and the edit
  // time picker respectively), default value of the time pickers equals the date time of when the 
  // user opened the picker. 

  useEffect(() => {
    let newNow = new Date();
    setPickerValue(newNow);
  }, [isDatePickerVisible, props.showEditPicker.show]);


  //----------------------------------------
  // THE USER PRESSES THE NEW ALARM BUTTON
  //----------------------------------------


  // this function sets the state boolean that determines whether the create time picker is visible 
  // to true so that when the user presses the button to create a new alarm the time picker shows

  const showDatePicker = () => {
    setDatePickerVisibility(true);

    // FOR DEBUGGING: this line runs a function that logs all of the notifications scheduled, so the
    // developer can make sure the timesPicked array in App.js, the async storage array and the
    // scheduled notifications are in sync. comment out when done debugging.

    getNextNotificationDate();

  };


  //----------------------------------------------------------------
  // THE USER CLOSES THE CREATE TIME PICKER WITHOUT SELECTING A TIME
  //----------------------------------------------------------------


  // this function sets the state boolean that determines the visibility of the create time picker to
  // false so that if the user Xes out of the time picker it will no longer show

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };


  //----------------------------------------------
  // THE USER CONFIRMS THE CREATION OF A NEW ALARM
  //----------------------------------------------


  // this function is called by the create time picker via the onConfirm prop. the time picker passes
  // the date argument which is a date time object containing the time the user selected for the new
  // alarm. this function calls a function passed down by App.js in the timePickerToApp prop which passes
  // the date object for the new alarm up to App.js where the new alarm is created, put into state and
  // storage, and the daily notification is scheduled.

  const handleConfirm = (date) => {

    // the alarm has been confirmed so hide the time picker
    hideDatePicker();

    // get the current date. if the user set an earlier date we'll just make sure that the alarm gets
    // scheduled for tomorrow for its first time to go off. 
    let now = new Date();

    if (date.getTime() <= now.getTime() ) {
      let tomorrowedDate = new Date(date.getTime() + 60 * 60 * 24 * 1000)

      // pass the alarm's date object up to App.js so the alarm can be created
      props.timePickerToApp(tomorrowedDate);

    } else {

      // pass the alarm's date object up to App.js so the alarm can be created
      props.timePickerToApp(date);

    }
  };


  //--------------------------------------------------------------
  // THE USER CLOSES THE EDIT TIME PICKER WITHOUT SELECTING A TIME
  //--------------------------------------------------------------


  // the visibility of the edit time picker, unlike the create time picker, is controlled by a 
  // state object in App.js, showEditPicker, 
  // which contains the id of the alarm in question and a boolean property
  // which is passed down as a prop to TimePicker and set as the edit picker's isVisible prop.
  // so to hide the edit picker we have to change that object in App.js. 

  const hideDateEditPicker = () => {

    // build the new state showEditPicker object, with a show property of false
    let newShowEditPicker = {id: props.showEditPicker.id, show: false, nId: props.showEditPicker.nId}

    // pass the new showEditPicker object up to App.js where it will update the state object
    props.changeEditVis(newShowEditPicker);
  }


  //----------------------------------------------
  // THE USER CONFIRMS AN EDIT TO AN OLD ALARM
  //----------------------------------------------


  // this function is called by the edit time picker via the onConfirm prop. the time picker passes
  // the date argument which is a date object corresponding to the time for the alarm selected by the
  // user. because this function needs to replace an old alarm in the timesPicked state array in 
  // App.js with a new edited version of the alarm, this function accesses the id and nId (notification
  // id) of the old alarm from the showEditPicker prop. then it cancels the scheduled notification with 
  // that nId. then it passes up a new alarm object (NOT DATE OBJECT) to App.js, which will replace 
  // the old alarm in the timesPicked state array.

  const handleEditConfirm = (date) => {

    // user has confirmed the edit so hide the edit picker.
    // change the showEditPicker state object in App.js to have a show 
    // property of false which is then passed down to timepicker as prop. 
    // the false value is passed up via changEditVis function passed down here as prop.
    let newShowEditPicker = {id: props.showEditPicker.id, show: false, nId: props.showEditPicker.nId}
    props.changeEditVis(newShowEditPicker);

    // cancel old notification. new notification will be scheduled in App.js
    cancelNotification(props.showEditPicker.nId);

    // get the current date. if the user set an earlier date we'll just make sure that the alarm gets
    // scheduled for tomorrow for its first time to go off. 
    let now = new Date();

    if (date.getTime() <= now.getTime() ) {
      let tomorrowedDate = new Date(date.getTime() + 60 * 60 * 24 * 1000);
      let newAlarmObj = {id: props.showEditPicker.id, time: tomorrowedDate, switch: true};

      // pass new Alarm object (NOT DATE OBJECT) up to App.js so can replace old alarm 
      props.editTimePickerToApp(newAlarmObj);

    } else {
      let newAlarmObj = {id: props.showEditPicker.id, time: date, switch: true};

      // pass new Alarm object (NOT DATE OBJECT) up to App.js so can replace old alarm 
      props.editTimePickerToApp(newAlarmObj);
    }
  }


  // --------------------------------------
  // THE USER STOPS THE ALARM FROM THE APP
  // --------------------------------------


  // this function dismisses all notifications and stops the alarm if the user's in the app.
  // other way to stop alarm is just by manually dismissing notification
  const stopAlarm = () => {
    Notifications.dismissAllNotificationsAsync();
  }


  // --------------------------------------
  // THE USER SNOOZES
  // --------------------------------------


  // this function dismisses all notifications and sets a one time alarm in five minutes from now.
  const snoozeAlarm = () => {
    Notifications.dismissAllNotificationsAsync();
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to pray!',
        sound: 'ourfather.m4a',
        vibrate: false
      },
      trigger: {
        seconds: 300,
        channelId: 'ourfather.m4a'
      },
    });
    setShowSnoozeModal(true);
  }

  // --------------------------------------
  // THE INTERFACE
  // --------------------------------------


  return (
    <View style={styles.container}>
      <SnoozeModal></SnoozeModal>
      <View style={styles.newAlarmContainer}>
        <TouchableOpacity style={styles.button} onPress={showDatePicker}>
          <Text style={styles.buttonText}>New Reminder</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.stopSnoozeContainer}>
        <View style={styles.stopContainer}>
          <TouchableOpacity style={styles.buttonRed} onPress={stopAlarm}>
            <Image source={stop} style={styles.sizeDown}></Image>
          </TouchableOpacity>
        </View>
        <View style={styles.snoozeContainer}>
          <TouchableOpacity style={styles.buttonOrange} onPress={snoozeAlarm}>
            <Image source={snooze} style={styles.sizeDown}></Image>
          </TouchableOpacity>
        </View>
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="time"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        is24Hour={false}
        date={pickerValue}
      />
      <DateTimePickerModal
        isVisible={props.showEditPicker.show}
        mode="time"
        onConfirm={handleEditConfirm}
        onCancel={hideDateEditPicker}
        is24Hour={false}
        date={props.editTime}
      />
    </View>
  );
};

// --------------------------------------
// --------------------------------------
// HELPER FUNCTIONS
// --------------------------------------
// --------------------------------------


// --------------------------------------
// CANCEL A NOTIFICATION
// --------------------------------------

// this function cancels a notification given an nId, called when the user edits an existing alarm

async function cancelNotification(notifId) {
  await Notifications.cancelScheduledNotificationAsync(notifId).then(
                                                                      (value) => {
                                                                          
                                                                      },
                                                                      (error) => {}
                                                                  );
}


// ----------------------------------------------
// FOR DEBUGGING: LOG ALL SCHEDULED NOTIFICATIONS
// ----------------------------------------------


// this function is called whenever the developer presses the new alarm button and logs all the
// scheduled notifications. makes it easy to check that notifications are being scheduled when they
// should be

async function getNextNotificationDate() {
  await Notifications.getAllScheduledNotificationsAsync().then(
      (value) => {
        console.log('\n \n \n');
        console.log('*****************************************************************************');
        console.log('-----------------------------------------------------------------------------');
        console.log('--------------Below is the array of all scheduled notifications--------------');
        console.log('-----------------------------------------------------------------------------');
        console.log('*****************************************************************************');
        console.log(' ')
        console.log('_____________________________________________________________________________');
        console.log('The length of the array is: ' + value.length);
        console.log('_____________________________________________________________________________');
        if (value.length == 0) {
          console.log(' ');
        } 
        for (let i = 0; i < value.length; i++) {
          console.log('The alarm time for the notification at index ' + i + ' is: Hour - ' + 
                      value[i].trigger.hour + ' Minute - ' + value[i].trigger.minute);
          console.log('_____________________________________________________________________________');
        }
        console.log(' ');
        console.log('*****************************************************************************');
        console.log('-----------------------------------------------------------------------------');
        console.log('---------This is the end of the array of all scheduled notifications---------');
        console.log('-----------------------------------------------------------------------------');
        console.log('*****************************************************************************');
        console.log('\n \n \n');
      },
      (error) => {
      }
  );
}


// ----------------------------------------------
// ----------------------------------------------
// STYLES
// ----------------------------------------------
// ----------------------------------------------


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  newAlarmContainer: {
    flex: 1
  },
  button: {
    alignItems: "center",
    backgroundColor: "#a7e7fa",
    height: (Dimensions.get('window').height*.12),
    width: (Dimensions.get('window').width*.95),
    justifyContent: "center",
    borderRadius: 7
  },
  stopSnoozeContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginTop: Dimensions.get('window').height*.047
  },
  stopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  snoozeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonRed: {
    alignItems: "center",
    backgroundColor: "#f77e7e",
    height: (Dimensions.get('window').height*.07),
    width: (Dimensions.get('window').width*.45),
    justifyContent: "center",
    borderRadius: 7
  },
  buttonOrange: {
    alignItems: "center",
    backgroundColor: "#fac97f",
    height: (Dimensions.get('window').height*.07),
    width: (Dimensions.get('window').width*.45),
    justifyContent: "center",
    borderRadius: 7
  },
  buttonText: {
    fontSize:RFPercentage(4),
    fontFamily: 'monospace',
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    color: '#292828'
  },
  sizeDown: {
    transform: [
      {scaleX: (Dimensions.get('window').height/14000)},
      {scaleY: (Dimensions.get('window').height/14000)}
    ]
  }
});

export default TimePicker;