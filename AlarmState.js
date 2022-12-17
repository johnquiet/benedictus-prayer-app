import {atom, selector} from 'recoil';

export const alarmState = atom({
    key: 'alarmState',
    default: [],
});

export const pushTokenState = atom({
    key: 'pushTokenState',
    default: '',
});

export const notificationState = atom({
    key: 'notificationState',
    default: false,
});

export const showEditPickerState = atom({
    key: 'showEditPickerState',
    default: {id:'', show: false},
});

export const editTimeState = atom({
    key: 'editTimeState',
    default: new Date(),
});

export const showPermissionsModalState = atom({
    key: 'showPermissionsModalState',
    default: false,
});

export const snoozeModalState = atom({
    key: 'snoozeModalState',
    default: false,
});

export const favoritesState = atom({
    key: 'favoritesState',
    default: [],
});

export const didSignOutState = atom({
    key: 'didSignOutState',
    default: false,
});

export const sessionSwitchState = atom({
    key: 'sessionSwitchState',
    default: false,
});

export const signInChangeState = atom({
    key: 'signInChangeState',
    default: false,
});

export const currentlySignedInState = atom({
    key: 'currentlySignedInState',
    default: false,
});

export const catPrayersState = atom({
    key: 'catPrayersState',
    default: {categoryElements: [], prayerObjects: []},
});