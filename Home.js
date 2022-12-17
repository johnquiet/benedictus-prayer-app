import React, { useState, useCallback, useRef, useEffect } from "react";
import { StatusBar } from 'expo-status-bar';
import { AppState, StyleSheet, Text, View, Image, LogBox, Platform, TouchableOpacity, Dimensions} from 'react-native';
import TimePicker from './TimePicker.js';
import AlarmList from './AlarmList.js';
import PermissionsModal from './PermissionsModal.js';
import uuid from 'react-native-uuid';
import * as Notifications from "expo-notifications";
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import Advertisement from './Advertisement.js';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { useFonts } from 'expo-font';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SplashScreen from 'expo-splash-screen';
import { useRecoilState } from 'recoil';
import { alarmState, pushTokenState, notificationState, showEditPickerState, editTimeState, showPermissionsModalState } from './AlarmState.js';


// --------------------------------------
// --------------------------------------
// SET UP
// --------------------------------------
// --------------------------------------





// --------------------------------------
// SET UP NOTIFICATION HANDLING FIRST
// --------------------------------------


Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX
    };
  },
});


// --------------------------------------
// DISABLE LOG WARNINGS IF PREFERRED
// --------------------------------------


// console.disableYellowBox = true;
// LogBox.ignoreLogs(['Warning: ...']);
// LogBox.ignoreAllLogs();


// --------------------------------------
// --------------------------------------
// THE APP
// --------------------------------------
// --------------------------------------


const Home = () => {


  // --------------------------------------
  // TOOLS FOR DEBUGGING
  // --------------------------------------


  // comment out when done using
  // below function deletes all async storage
  // clearAll();
  // below function cancels all scheduled notifications
  // Notifications.cancelAllScheduledNotificationsAsync();


  


  // --------------------------------------
  // STATE VARIABLES
  // --------------------------------------


  // stores push token necessary for sending notifications
  const [expoPushToken, setExpoPushToken] = useRecoilState(pushTokenState);

  // stores subscription object returned from notificationReceivedListener
  const [notification, setNotification] = useRecoilState(notificationState);

  /* 
    below timesPicked variable stores all of the alarms that the user has set. contains an object 
    for each alarm.

    each alarm object looks like:

      {
        id: string,
        time: date object,
        nId: string,
        switch: boolean,
        alarmTime: string,
      }
    
    this is also what the objects in storage look like.
    the nId is the notification id for the scheduled notification for the given alarm
    the alarmtime is a string of the military time taken from the time property e.g. "2200."
    alarmTime is always four characters long.
  */

  const [timesPicked, setTimesPicked] = useRecoilState(alarmState);
  // console.log('this is the length of timespicked: ' + timesPicked.length);
  
  // stores the id of the alarm being edited and whether it is being edited
  const [showEditPicker, setShowEditPicker] = useRecoilState(showEditPickerState);


  const [editTime, setEditTime] = useRecoilState(editTimeState);

  // stores whether or not the app has notifications permissions. if not shows request modal.
  const [showPermissionsModal, setShowPermissionsModal] = useRecoilState(showPermissionsModalState);

  // tracks when app comes into foreground so alarms will be refreshed from storage
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);


  // --------------------------------------
  // REF VARIABLES
  // --------------------------------------


  // stores the subscription object from the last notification to trigger notificationReceivedListener
  const notificationListener = useRef();

  // stores the subscription object from the last notification to trigger notificationResponseReceivedListener
  const responseListener = useRef();


  // --------------------------------------
  // SET UP NOTIFICATIONS ON APP LAUNCH
  // --------------------------------------


  // call useEffect with [] argument so that notifications are only set up once on launch
  useEffect(() => {

    // check for notifications permissions, get them if missing, and get token for notifications
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);

      // if could not get permissions successfully show modal asking user to enable in settings
      if (token == 'nope') {
        setShowPermissionsModal(true);
      }

    });

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('just got notification!!!');
    });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // console.log(response);
    });

    // remove the subscription objects returned by the listeners above
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };

  }, []);


  // --------------------------------------
  // SET UP ADVERTISEMENTS ON APP LAUNCH
  // --------------------------------------


  // call useEffect with [] argument so that ads are only set up once on launch
  useEffect(() => {

    mobileAds()
      .setRequestConfiguration({
        // Update all future requests suitable for parental guidance
        maxAdContentRating: MaxAdContentRating.PG,

        // Indicates that you want your content treated as child-directed for purposes of COPPA.
        tagForChildDirectedTreatment: false,

        // Indicates that you want the ad request to be handled in a
        // manner suitable for users under the age of consent.
        tagForUnderAgeOfConsent: true,

        // An array of test device IDs to allow.
        testDeviceIdentifiers: ['EMULATOR', '355984760893962'],
      })
      .then(() => {
        // Request config successfully set!
        mobileAds()
          .initialize()
          .then(adapterStatuses => {
            // Initialization complete!
          });
      });
  }, []);


  // --------------------------------------
  // GET ALARMS FROM STORAGE ON APP LAUNCH
  // --------------------------------------


  // call useEffect with [] argument so that the alarms are got once on app launch
  useEffect(() => {

    console.log('getting data')

    getData().then(
      (value) => { 

        // store the alarms in the TimesPicked state variable
        setTimesPicked((oldValue) => value);

      },
      (error) => {console.log(error)}
    );
  }, []);


  // --------------------------------------------------------
  // GET ALARMS FROM STORAGE ON APP TO FOREGROUND
  // --------------------------------------------------------


  useEffect(() => {
    const subscription = AppState.addEventListener("change", _handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // --------------------------------------------------------
  // STORE ALARMS IN ASYNC STORAGE WHEN USER ADDS/EDITS ALARM
  // --------------------------------------------------------


  // call useEffect with [timesPicked] argument so that alarms go to async storage when added
  // or edited and timesPicked changes
  useEffect(() => {
    
    console.log('storing data');

    // store the alarms in async storage
    storeData(timesPicked).then(
      () => { },
      (error) => { }
    );

  }, [timesPicked]);

  // --------------------------------------------------------
  // GET ALARMS FROM STORAGE ON APP TO FOREGROUND
  // --------------------------------------------------------


  const _handleAppStateChange = nextAppState => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!');
      
      getData().then(
        (value) => { 
          console.log('got data on app to foreground now about to add to state');
          // store the alarms in the TimesPicked state variable
          setTimesPicked((oldValue) => value);
  
        },
        (error) => {console.log(error)}
      );
      
    }

    appState.current = nextAppState;
    setAppStateVisible(appState.current);
    console.log('AppState', appState.current);
  };

  // --------------------------------------
  // USER ADDS AN ALARM
  // --------------------------------------


  // this function is passed down to TimePicker element as a prop and then called in TimePicker.js
  // to send the data here as a date object, timeJustPicked

  const timePickerToApp = (timeJustPicked) => {
    
    // schedule a notification for the time picked by the user in TimePicker.js
    schedulePushNotification(timeJustPicked.getHours(), timeJustPicked.getMinutes()).then(
      (value) => {

        // build the alarm object which will be stored in timesPicked state variable and ultimately
        // in async storage

        // 1. include the notification id returned by the schedule notification function so that you can
        // delete notifications later on when the user is editing or deleting their alarms
        let notifId = value;

        // 2. include a unique identifier in the alarm object so it is easy to access anywhere in code
        let alarmId = uuid.v4();

        // 3. include the time the alarm should go off and make sure its in military time
        let alarmTime = military(timeJustPicked);

        // 4. put the alarm object together
        let timeJustPickedObject = {id: alarmId, 
                                    time: timeJustPicked, 
                                    nId: notifId, 
                                    switch: true,
                                    alarmTime: alarmTime}
                                  
        // add the new alarm to the timesPicked array, after which it will be added to async storage                         
        setTimesPicked((oldTimesPicked) => [...oldTimesPicked, timeJustPickedObject]);

      },
      (error) => {console.log(error)}
    );
  }


  // --------------------------------------
  // USER CONFIRMS EDIT TO AN ALARM
  // --------------------------------------


  // this function is passed down to the TimePicker element as a prop and is called from TimePicker.js
  // to pass the edited alarm object here as an alarm object (NOT A DATE OBJECT), timeJustPickedObject

  const editTimePickerToApp = (timeJustPickedObject) => {

    // schedule a new notification for the new time picked by the user (the old notification was 
    // deleted in TimePicker.js)
    schedulePushNotification(timeJustPickedObject.time.getHours(), timeJustPickedObject.time.getMinutes()).then(
      (value) => {

        // edit the alarm object which will be stored in timesPicked state variable and ultimately
        // in async storage

        // 1. include the notification id returned by the schedule notification function so that you can
        // delete notifications later on when the user is editing or deleting their alarms
        timeJustPickedObject.nId = value;

        // 2. include the new alarm time and ensure it's in military time

        // NOTE: the reason there is both a alarmTime prop and a time prop on the alarm objects is 
        // that the alarmTime prop simply stores a string of the alarmtime, while the time prop
        // is literally a date object of the time for the alarm

        timeJustPickedObject.alarmTime = military(timeJustPickedObject.time);

        // replace the old alarm in the timesPicked state array with the new, edited alarm object
        // first create a new array where the old object is replace with the new using map
        const newTimesPicked = timesPicked.map(obj => {

          // if a given alarm has the id of the alarm edited, replace it with the new, edited alarm
          if (obj.id === timeJustPickedObject.id) {
            return timeJustPickedObject;
          }

          // if a give nalarm does not match the id of the alarm edited, just leave it as is
          return obj;

        });

        // once the old alarm has been replaced with the new, edited alarm in the array, update state
        setTimesPicked((oldTimes) => newTimesPicked);

      },
      (error) => {}
    );
  }


  // --------------------------------------
  // USER TURNS AN ALARM ON THAT WAS OFF
  // --------------------------------------


  // this function is passed to AlarmList as a prop. AlarmList.js then calls it to pass up the alarm
  // to be turned on as an alarm object (NOT DATE OBJECT) 

  const switchListToApp = (alarmObject) => {

    // schedule a notification for the alarm that is being turned back on
    schedulePushNotification(alarmObject.time.getHours(), alarmObject.time.getMinutes()).then(
      (value) => {

        // the alarm object passed up already has all the needed properties defined except has an
        // nId (notification id) property that is undefined so we need to add that since we just 
        // scheduled a notification for the alarm

        // include the notification id 
        alarmObject.nId = value;

        // create an array of the alarms in timesPicked and replace the alarm in question with a new
        // object that includes an active notification id 
        const newSwitchTimesPicked = timesPicked.map(obj => {

          // if a given alarm has the id of the alarm turned on, replace it with the new, turned on alarm
          if (obj.id === alarmObject.id) {
            return alarmObject;
          }

          // if a given alarm does not match the id of the alarm edited, just leave it as is
          return obj;
          
        });
        setTimesPicked(() => newSwitchTimesPicked);
      },
      (error) => {}
    );
  }


  // --------------------------------------
  // USER TURNS AN ALARM OFF THAT WAS ON
  // --------------------------------------


  // this function is passed to AlarmList as a prop. AlarmList.js then calls it to pass up the alarm 
  // object that will be replacing the old one. the only difference between the two is that the new one
  // has no nId (notification id) since it is turned off and no notification is set.

  const switchListToAppUpdate = (alarmObject) => {

        // create a new array made up of the alarms in timesPicked. find the element that has the same
        // id as the new alarmobject passed up, and replace it with the new alarm object. the old and new
        // are the same except the new has an undefined nId
        const newSwitchTimesPicked = timesPicked.map(obj => {

          // if given element's id matches the new alarm's id replace that element with the new alarm
          if (obj.id === alarmObject.id) {
            return alarmObject;
          }

          // if given element's id does not match the new alarm's id, keep the given element in the array 
          return obj;
        });

        // set timesPicked state array to equal the new array of alarms with the old alarm replaced
        // so that the alarm is "turned off," having no nId
        setTimesPicked(() => newSwitchTimesPicked);
  }


  // --------------------------------------
  // USER DELETES AN ALARM
  // --------------------------------------


  // this function is passed down to AlarmList as a prop and is then called in AlarmList.js to pass up
  // the id of the item to delete from the interface. the associated scheduled notification was already
  // deleted in AlarmListItem.js when the user pressed the delete button. so this function deletes
  // the alarm in state array (which removes it visually from interface) and deletes it from storage

  const alarmListToAppDelete = (itemKeyToDelete) => {

    // delete the element from the alarms state array which has the matching id
    setTimesPicked(current =>
      current.filter(alarm => {

        // keep given element only if it doesn't match the id to delete
        return alarm.id !== itemKeyToDelete;

      }),
    );

    // delete alarm from storage
    removeValue(itemKeyToDelete);

  }


  // --------------------------------------
  // USER PRESSES EDIT BUTTON
  // --------------------------------------


  // this function is passed as a prop down to the AlarmList and is then called in AlarmList.js to 
  // pass up an object containing the id of the alarm to be edited, the associated nId (notification
  // id) and a boolean value of true indicating the user wants the edit time picker to appear
  // then this function sets a state object which is passed as a prop down to TimePicker so that
  // it has all the necessary info about what alarm it is editing once it's shown

  const changeEditVis = (accessKeyObject) => {
    // set showeditpicker to true and pass down
    setShowEditPicker(accessKeyObject);

    // also set state variable with a datetime object for the alarm to be edited and pass down
    // via props so that the picker when it appears displays the old time for the alarm

    let alarmToEditArr = timesPicked.filter((obj) => {
      return obj.id === accessKeyObject.id;
    });

    // set state variable to the previous time for the alarm this will be passed down to picker as a prop
    setEditTime(alarmToEditArr[0].time);
  }


  // -----------------------------------------------------------------
  // USER CLOSES APP PERMISSIONS MODAL (NOT THE ANDROID ONE)
  // -----------------------------------------------------------------


  // this function is passed down to PermissionsModal as a prop and is then called by PermissionsModal.js
  // to pass up a false boolean indicating that the user would not like to see the modal any more
  // showPermissionsModal is initially set on app launch depending if permissions are already given
  // see the useEffect function above

  const changePermVis = (newValue) => {
    if (newValue == true) {
      setShowPermissionsModal(true);
    } else {
      setShowPermissionsModal(false);
    }
  }


  // ---------------------------------------------------------------------
  // FOR DEBUGGING: LOG THE ALARMS STATE ARRAY AND THE ASYNC STORAGE ARRAY 
  // ---------------------------------------------------------------------


  // this function fires if the developer taps on the bugle call title/logo at the top of the screen
  // it logs the alarms state array and the alarms async storage array. this makes it easy to 
  // test that they are sync'd. the other custom debug function in this app can be found in 
  // TimePicker.js, which logs all of the scheduled notifications every time the create alarm 
  // button is pressed. using these two debug functions makes it easy to test that state, storage,
  // and notifications are all sync'd.

  const logTimesArray = () => {
    console.log('\n \n \n');
    console.log('*****************************************************************************');
    console.log('-----------------------------------------------------------------------------');
    console.log('--------------Below is the array of all the alarm objects--------------------');
    console.log('-----------------------------------------------------------------------------');
    console.log('*****************************************************************************');
    console.log(' ')
    console.log('_____________________________________________________________________________');
    console.log('The length of the array is: ' + timesPicked.length);
    console.log('_____________________________________________________________________________');
    for (let i = 0; i <timesPicked.length; i++) {
        console.log('Object at index ' + i + ':');
        console.log('id: ' + timesPicked[i].id + ' of type ' + typeof timesPicked[i].id);
        console.log('time: ' + timesPicked[i].time + ' of type ' + typeof timesPicked[i].time);
        console.log('nId: ' + timesPicked[i].nId + ' of type ' + typeof timesPicked[i].nId);
        console.log('switch: ' + timesPicked[i].switch + ' of type ' + typeof timesPicked[i].switch);
        console.log('alarmTime: ' + timesPicked[i].alarmTime + ' of type ' + typeof timesPicked[i].alarmTime);
        console.log('_____________________________________________________________________________');
    }
    console.log(' ');
    console.log('*****************************************************************************');
    console.log('-----------------------------------------------------------------------------');
    console.log('---------This is the end of the array of all the alarm objects---------------');
    console.log('-----------------------------------------------------------------------------');
    console.log('*****************************************************************************');
    console.log('\n \n \n');
    getData().then(
      (value) => { 
        console.log('\n \n \n');
        console.log('*****************************************************************************');
        console.log('-----------------------------------------------------------------------------');
        console.log('---------Below is the array of all the alarm objects in storage--------------');
        console.log('-----------------------------------------------------------------------------');
        console.log('*****************************************************************************');
        console.log(' ')
        console.log('_____________________________________________________________________________');
        console.log('The length of the array is: ' + value.length);
        console.log('_____________________________________________________________________________');
        for (let i = 0; i < value.length; i++) {
          console.log('Object at index ' + i + ':');
          console.log('id: ' + value[i].id + ' of type ' + typeof value[i].id);
          console.log('time: ' + value[i].time + ' of type ' + typeof value[i].time);
          console.log('nId: ' + value[i].nId + ' of type ' + typeof value[i].nId);
          console.log('switch: ' + value[i].switch + ' of type ' + typeof value[i].switch);
          console.log('alarmTime: ' + value[i].alarmTime + ' of type ' + typeof value[i].alarmTime);
          console.log('_____________________________________________________________________________');
        } 
        console.log(' ');
        console.log('*****************************************************************************');
        console.log('-----------------------------------------------------------------------------');
        console.log('------This is the end of the array of all the alarm objects in storage-------');
        console.log('-----------------------------------------------------------------------------');
        console.log('*****************************************************************************');
        console.log('\n \n \n');
      },
      (error) => {}
    );
    /*
    Notifications.deleteNotificationChannelAsync('churchillbeaches.wav');
    Notifications.deleteNotificationChannelAsync('eisenhowerdday.wav');
    Notifications.deleteNotificationChannelAsync('ronaldreagangorbachev.wav');
    */
  }

  // --------------------------------------
  // THE INTERFACE
  // --------------------------------------


  return (
    <View style={styles.container}>
      <PermissionsModal changePermVis={changePermVis} showPermissionsModal={showPermissionsModal}></PermissionsModal>
      <View style={{height: Dimensions.get('window').height*.025}}></View>
      <View style={styles.listContainer}>
        <AlarmList changeEditVis={changeEditVis} alarmListToAppDelete={alarmListToAppDelete} 
        appToAlarmList={timesPicked} switchListToApp={switchListToApp}
        switchListToAppUpdate={switchListToAppUpdate}></AlarmList>
      </View>
      
      <View style={styles.timePickerContainer}>
        <TimePicker changeEditVis={changeEditVis} 
        showEditPicker={showEditPicker} editTimePickerToApp={editTimePickerToApp}
        timePickerToApp={timePickerToApp} editTime={editTime}></TimePicker>
      </View>
      <StatusBar style="light" />
    </View>
  );
}


//---------------------------------
//---------------------------------
// HELPER FUNCTIONS: 
//---------------------------------
//---------------------------------


//---------------------------------
// GET PERMISSION FOR NOTIFICATIONS
//---------------------------------


// this function is only called on app launch and sets up notification channels for future notifications. 
// then it checks if the user has given permission for notifications yet. if not, the function requests 
// permission. this causes an automatic modal to appear from the android system if the user hasn't 
// given or denied permission yet. but if they already have, then this function shows a modal that 
// asks them to go to settings and manually give permission. finally, this function returns a pushtoken
// which is needed to send notifications.

async function registerForPushNotificationsAsync() {

  let sounds = [
    ['Morning', 'ourfather.m4a'],
    ['Afternoon', 'hailmary.m4a'],
    ['Evening', 'glorybe.m4a']
  ];

  // set up notification channels
  if (Platform.OS === 'android') {
    for (let sound of sounds) {
      Notifications.setNotificationChannelAsync(sound[1], {
        name: sound[0],
        sound: sound[1],
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#a7e7fa',
      });
    }
  }

  let token;

  // check to make sure this isn't happening on the web
  if (Device.isDevice) {

    // check if notifications permission has been given
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {

      // if notifications permission has not been given then request it, this causes a system modal
      // to appear if user hasn't yet explicitly denied notification permission
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // if the user denies the system modal permission or has already denied it in the past, then
    // return 'nope' which will indicate to the useEffect call at the beginning of App.js that the 
    // app modal asking user to enable permissions manually in settings 
    if (finalStatus !== 'granted') {
      return 'nope';
    }

    console.log('about to get token');

    // get the token so there are no issues scheduling notifications, will be stored in state
    token = (await Notifications.getExpoPushTokenAsync({
      experienceId: 'EXPERIENCE_ID_GOES_HERE',
    })).data;

    console.log('should see token below this line');
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}


//---------------------------------
// SCHEDULE NOTIFICATION
//---------------------------------


// this function schedules a notification which will play a random notification sound from the 
// channelsounds array below at the time specified by the arguments hours and minutes. 
async function schedulePushNotification(hours, minutes) {

  var sound;

  if (hours < 12) {
    sound = "ourfather.m4a";
  } else if (hours > 12 && hours < 17) {
    sound = "hailmary.m4a";
  } else {
    sound = "glorybe.m4a";
  }

  console.log('sound to be used for notification just scheduled: ' + sound);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to pray!',
      sound: sound,
      vibrate: false,
      priority: Notifications.AndroidNotificationPriority.MAX
    },
    trigger: {
      hour: hours,
      minute: minutes,
      channelId: sound,
      repeats: true,
    },
  });
  return id;
}


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


//---------------------------------------------------
// CONVERT DATE OBJECT'S TIME TO MILITARY TIME STRING
//---------------------------------------------------


// this function takes a date object as an argument and returns a string represetning the timefor dsiplay
function military(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  if (hours < 10) {
    var strTime = ' ' + hours + ':' + minutes + ampm;
  } else {
    var strTime = hours + ':' + minutes + ampm;
  }
  return strTime;
}

//---------------------------------
// GET ALARMS FROM ASYNC STORAGE
//---------------------------------

// this function is called on app launch and gets all of the alarms from async storage and 
// places them in the timesPicked state array so they will be displayed in the interface.
async function getData() {
  let keys;
  let values;
  let arrayToSet = [];
  try {

    // first get all the keys in storage 
    keys = await AsyncStorage.getAllKeys();

    let finalKeys = keys.filter((key) => {
      return key.startsWith('freepray');
    });

    // then get all the data with the keys
    values = await AsyncStorage.multiGet(finalKeys);

    // then build the array that will be set
    if (values.length > 0) {
      for (let i of values) {
        let preObject = JSON.parse(i[1]);

        // the time property of the alarm object just parsed from the string is only a datetime string
        // but it needs to be a date object since that's who it is accessed throughout the app
        // so let's make an object based off it and put that in the state array instead
        if (preObject.hasOwnProperty('time')) {
          preObject.time = new Date(preObject.time);
        }
        preObject.fromStorage = true;
        arrayToSet.push(preObject); 
      }
      return arrayToSet;
    } else {
      return [];
    }
  } catch(e) {
    // error reading value
    console.log('error using AsyncStorage: ');
    console.log(e);
    // return [];
  }
}


//---------------------------------
// STORE ALARMS IN ASYNC STORAGE
//---------------------------------


// store data in storage 
async function storeData(arrayToStore) {
  for (let k of arrayToStore) {
    try {

      // async storage only accepts strings
      const jsonValue = JSON.stringify(k);

      // set the storage key to be the alarm's id
      await AsyncStorage.setItem('freepray' + k.id, jsonValue)
    } catch (e) {}
  }
}


//---------------------------------
// DELETE ALARM FROM ASYNC STORAGE
//---------------------------------


// this function deletes an alarm from storage given an alarm object id argument 
async function removeValue(alarmObjectId) {
  try {
      await AsyncStorage.removeItem('freepray' + alarmObjectId);
  } catch(e) {
      // remove error
      console.log('error removing: ' + e);
  }
}


//------------------------------------------
// CLEAR ALL DATA IN STORAGE (FOR DEBUGGING)
//------------------------------------------


// clear all data if need be for testing
async function clearAll() {
  try {
    await AsyncStorage.clear()
  } catch(e) {
    // clear error
  }
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
  listContainer: {
    flex: 15.7,
    justifyContent: 'flex-start'
  },
  timePickerContainer: {
    flex: 6.8,
    justifyContent: 'center'
  },
  adContainer: {
    flex: 1.5,
    justifyContent: 'flex-end'
  }
});

export default Home;