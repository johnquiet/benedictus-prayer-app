# Benedictus, a prayer app

Benedictus is a prayer app that allows the user to pray along with various prayer recordings, save prayers to favorites for easy access, and set reminders to pray.

This is the first complete mobile application that I have developed, so I wanted to showcase the code and a demo in a public repository. Please watch the demo video if you would like to get a better idea of what the app does!

# Demo

https://user-images.githubusercontent.com/116132876/208224358-30406d94-d0ec-42b6-a1e7-b3685582ee5a.mp4

# About the App

## Development Tools

I created benedictus using React Native and Expo. While the code can be adapted at some point to run on iOS, the code is written with Android in mind.

## The Database

The back end uses Back4App, which communicates with the client via the Parse SDK.

The app makes 3 database queries on app launch, and then two queries or one query every time the user adds a favorite prayer or deletes a favorite prayer, respectively. Otherwise, everything is handled locally in the app's state. 

The database contains five tables, one each to contain the users, sessions, prayer categories, prayers, and favorites (this last containing two foreign keys from prayers and users).

## State Management

State management is handled through Recoil. Many times in the app it is necessary for a deeply nested component to communicate with a component far from it in the tree, so Recoil was a simple way to achieve this. 

## Notifications

Per Expo's recommendation, the app's reminder notifications are handled using Firebase. Although all the notifications are local, it was necessary to register with firebase to use the expo-notification library, even locally.

## Audio

The prayer recordings in the app are played using the expo-av library.


