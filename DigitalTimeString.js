import React from 'react';
import { Text } from 'react-native';
import styles from './styles.js';


//----------------------------------------
//----------------------------------------
// THE DIGITAL TIMESTRING COMPONENT
//----------------------------------------
//----------------------------------------


// this component displays a time string tracking the progress of the prayer audio being played
// by AudioSlider.js. Currently, this component is not part of the app, but could be used at a 
// later date if the occasion arises to display the actual time progress of the audio. the reason
// this is not currently used is that it doesn't fit the design aesthetic of the prayer component.

export default class DigitalTimeString extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            time: this.props.time
        }
    };

    str_pad_left = (string, pad, length) => {
        return (new Array(length + 1).join(pad) + string).slice(-length);
    }

    convertNumberToTime = (total_milli_seconds) => {
        if (total_milli_seconds < 0) {
            return '00:00:00'
        }
        let total_seconds = total_milli_seconds / 1000;
        total_seconds = Number((total_seconds).toFixed(0));

        let hours = Math.floor(total_seconds / 3600);
        let seconds_left = total_seconds - hours * 3600;
        let minutes = Math.floor(seconds_left / 60);
        let seconds = seconds_left - minutes * 60;

        let finalTime = this.str_pad_left(minutes, '0', 2) + ':' + this.str_pad_left(seconds, '0', 2);
        return finalTime
    }

    render() {
        let time = this.convertNumberToTime(this.props.time);

        return (
            <Text style={[styles.StandardText]}>
                {time}
            </Text>
        )
    }
}