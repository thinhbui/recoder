import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity
} from 'react-native';

import Sound from 'react-native-sound';
export default class MessageAudio extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      play: false,
    }
  }
  async _pause() {
    if (!this.state.recording) {
      console.warn('Can\'t pause, not recording!');
      return;
    }
    // this.setState({ stoppedRecording: true, recording: false });

    try {
      const filePath = await AudioRecorder.pauseRecording();

      // Pause is currently equivalent to stop on Android.
      if (Platform.OS === 'android') {
        this._finishRecording(true, filePath);
      }
    } catch (error) {
      console.error(error);
    }
  }
  async _play() {
    if (this.state.recording) {
      await this._stop();
    }

    // These timeouts are a hacky workaround for some issues with react-native-sound.
    // See https://github.com/zmxv/react-native-sound/issues/89.
    setTimeout(() => {
      var sound = new Sound(this.props.currentMessage.audio, '', (error) => {
        if (error) {
          console.log('failed to load the sound', error);
        }
      });

      setTimeout(() => {
        sound.play((success) => {
          if (success) {
            console.log('successfully finished playing');
          } else {
            console.log('playback failed due to audio decoding errors');
          }
        });
      }, 100);
    }, 100);
  }
  render() {
    const { width, height } = Dimensions.get('window');

    return (
      <View style={[styles.container, this.props.containerStyle]}>
        {this.state.play}?
        <TouchableOpacity style={{ width: 100, height: 100 }} onPress={() => this._pause()}>

        </TouchableOpacity>
        :
        <TouchableOpacity style={{ width: 100, height: 100 }} onPress={() => this._play()}>

        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
  },
  audio: {
    width: 150,
    height: 100,
    borderRadius: 13,
    margin: 3,
    resizeMode: 'cover',
  },
  audioActive: {
    resizeMode: 'contain',
  },
});

MessageAudio.defaultProps = {
  currentMessage: {
    audio: null,
  },
  containerStyle: {},
  audioStyle: {},
  audioProps: {},

};

MessageAudio.propTypes = {
  currentMessage: React.PropTypes.object,
  containerStyle: View.propTypes.style,
  audioStyle: Audio.propTypes.style,
  audioProps: React.PropTypes.object,
};
