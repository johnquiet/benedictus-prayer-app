import React, { useEffect } from "react";
import { RecoilRoot } from 'recoil';
import Navigation from './Navigation.js';
import Parse from "parse/react-native.js";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import uuid from 'react-native-uuid';


//---------------------------------
//---------------------------------
// THE APP
//---------------------------------
//---------------------------------


//Initializing the SDK. 
Parse.setAsyncStorage(AsyncStorage);
//You need to copy BOTH the the Application ID and the Javascript Key from: Dashboard->App Settings->Security & Keys 
Parse.initialize('APPLICATION_ID_GOES_HERE','JAVASCRIPT_KEY_GOES_HERE');
Parse.serverURL = 'https://parseapi.back4app.com/';
Parse.enableEncryptedUser();
let mySecret = 'ENCRYPTION_SECRET_KEY_GOES_HERE';
Parse.secret = mySecret;

GoogleSignin.configure({
  webClientId:
    'GOOGLE_CLOUD_CONSOLE_WEB_CLIENT_ID_GOES_HERE',
});

export default function App() {

  return (
    <RecoilRoot>
      <Navigation></Navigation>
    </RecoilRoot>
  );
}




