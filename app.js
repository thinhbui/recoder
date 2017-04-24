/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import React, { Component } from 'react';
import {
    AppRegistry,
    Text,
    View, StyleSheet
} from 'react-native';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    MediaStream,
    MediaStreamTrack,
    getUserMedia,
} from 'react-native-webrtc';

// import App from "./app/app.js";

export default class App extends Component {
    // Initial state
    constructor(props) {
        super(props)
        this.state = {
            videoURL: null,
            isFront: true
        }
    }

    componentDidMount() {
        const configuration = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };
        const pc = new RTCPeerConnection(configuration);
        const { isFront } = this.state;
        MediaStreamTrack.getSources(sourceInfos => {
            console.log('MediaStreamTrack.getSources', sourceInfos);
            let videoSourceId;
            for (let i = 0; i < sourceInfos.length; i++) {
                const sourceInfo = sourceInfos[i];
                // I like ' than "
                if (sourceInfo.kind === 'video' && sourceInfo.facing === (isFront ? 'front' : 'back')) {
                    videoSourceId = sourceInfo.id;
                }
            }
            getUserMedia({
                audio: true,
                // THIS IS FOR SIMULATOR ONLY
                // In fact, you better test on real iOS/Android device
                // We just can test audio on simulator, so i set video = false
                // video: Platform.OS === 'ios' ? false : {
                video: {
                    mandatory: {
                        minWidth: 500, // Provide your own width, height and frame rate here
                        minHeight: 300,
                        minFrameRate: 30
                    },
                    facingMode: (isFront ? 'user' : 'environment'),
                    optional: (videoSourceId ? [{ sourceId: videoSourceId }] : [])
                }
            }, (stream) => {
                // use arrow function :)
                // (stream) or stream are fine
                console.log('Streaming OK', stream);
                this.setState({
                    videoURL: stream.toURL()
                });
                pc.addStream(stream);
            }, error => {
                console.log('Oops, we getting error', error.message);
                throw error;
            });
        });
        pc.createOffer((desc) => {
            pc.setLocalDescription(desc, () => {
                // Send pc.localDescription to peer
                console.log('pc.setLocalDescription');
            }, (e) => { throw e; });
        }, (e) => { throw e; });

        pc.onicecandidate = (event) => {
            // send event.candidate to peer
            console.log('onicecandidate', event);
        };

    }

    render() {
        return (
            <RTCView streamURL={this.state.videoURL} style={styles.container} />
        );
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ccc',
        borderWidth: 1,
        borderColor: '#000'
    }
})
AppRegistry.registerComponent('a', () => App);