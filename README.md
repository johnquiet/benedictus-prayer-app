![freepraylogo](https://user-images.githubusercontent.com/116132876/208253752-9412126b-031a-4231-9e1b-b5e83525d405.png)

![prayerstabprayersresized](https://user-images.githubusercontent.com/116132876/208253477-87a14cf6-ec76-4fd9-8c7e-43714763c619.png)

## A Prayer App

Benedictus is a prayer app that allows the user to pray along with various prayer recordings, save prayers to favorites for easy access, and set reminders to pray.

This is the first complete mobile application that I have developed, so I wanted to showcase the code and a demo in a public repository. Please watch the demo video and turn the sound on if you would like to get a better idea of what the app does!

# Demo

https://user-images.githubusercontent.com/116132876/208224358-30406d94-d0ec-42b6-a1e7-b3685582ee5a.mp4

# About the App

## Development Tools

I created benedictus using React Native and Expo. While the code can be adapted at some point to run on iOS, the code is written with Android in mind.

## The Database

The back end uses Back4App, which communicates with the client via the Parse SDK.

The app makes 3 database queries on app launch, 1 query on user sign in, and then one or two queries every time the user adds a favorite prayer or deletes a favorite prayer. One apparent limitation of the Parse SDK is that the developer is expected to make two queries to perform an outer join query, instead of just one.

The database contains five tables, one each to contain the users, sessions, prayer categories, prayers, and favorites (this last containing two foreign keys from prayers and users).

## State Management

State management is handled through Recoil. Many times in the app it is necessary for a deeply nested component to communicate with a component far from it in the tree, so Recoil was a simple way to achieve this. 

## Notifications

Per Expo's recommendation, the app's reminder notifications are handled using Firebase. Although all the notifications are local, it was necessary to register with firebase to use the expo-notification library, even locally.

## Audio

The prayer recordings in the app are played using the expo-av library.

# Features

## Reminders Tab

The reminders tab lets the user set prayer reminders for when they would like to pray. When the time comes, the app will play a short prayer over the phone's audio to remind the user. The prayer will either be an Our Father, a Hail Mary, or a Glory Be, depending on the time of day. To stop the audio from playing the user can simply open their notifications tray, press the power button once, or press the red bell button at the bottom of the reminders tab. If the user would like to quickly set a short reminder for five minutes in the future, the user can push the yellow button at the bottom of the reminders tab.

![reminderstabresized](https://user-images.githubusercontent.com/116132876/208253458-efc3a6cd-61ad-4047-87c8-69325dbeef06.png)

## Prayers Tab

The prayers tab displays all of the prayer categories for the prayers currently in the database, as well as a button that takes the user to their favorites. When the user clicks on a prayer category button, the prayers tab displays all of the prayers in that category. Then, the user can expand the text for the prayer they want to pray along with by clicking the blue "+" button. To listen to the prayer, the user just clicks the play button, and can drag the progress bar to any point in the recording. If the user likes a particular prayer, they can favorite the prayer by pressing the plus heart button to the right of the prayer. This will add the prayer to their favorites which can be accessed by pressing the "Favorites" button at the top of the categories screen. 

![prayerstabcategoriesresized](https://user-images.githubusercontent.com/116132876/208253470-2a5bb983-a785-4fc6-9425-e0d9f4fc008e.png)
![prayerstabprayersresized](https://user-images.githubusercontent.com/116132876/208253477-87a14cf6-ec76-4fd9-8c7e-43714763c619.png)
![prayerstabtextresized](https://user-images.githubusercontent.com/116132876/208253485-0e7f3c1e-5c9f-4345-b1ef-6f6b797ae65d.png)


## Search Tab

Sometimes, the user may wish to go straight to a prayer rather than have to find it in the categories. The user can go to the search tab and type in the name of the prayer they are looking for. The search tab will display results with similar names in order of how similar they are to the search term. The user can favorite prayers on the search tab just like on the prayer tab.

![searchtabresized](https://user-images.githubusercontent.com/116132876/208253493-8a84f439-fcef-415a-a75f-bc97ceb61ff7.png)

## Profile Tab

On the profile tab, the user can sign in and out of the app. The user must be signed in to use the favorites feature. If the user is not signed in and tries to favorite a prayer, the user will be directed to sign in. The user can also delete their account and all of its data using the delete account button on the profile tab.

![profiletabresized](https://user-images.githubusercontent.com/116132876/208253498-33b12a44-2307-4b7d-9e9d-871000035969.png)








