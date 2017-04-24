import React from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    StatusBar,
    Text, Image, CameraRoll,
    Platform,
    PermissionsAndroid
} from 'react-native';
import Camera from 'react-native-camera';
import CameraRollPicker from 'react-native-camera-roll-picker';
import NavBar, { NavButton, NavButtonText, NavTitle } from 'react-native-nav';
import Sound from 'react-native-sound';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
export default class CustomActions extends React.Component {
    constructor(props) {
        super(props);
        this.camera = null;

        this.state = {
            camera: {
                aspect: Camera.constants.Aspect.fill,
                captureTarget: Camera.constants.CaptureTarget.cameraRoll,
                type: Camera.constants.Type.back,
                orientation: Camera.constants.Orientation.auto,
                flashMode: Camera.constants.FlashMode.auto,
            },
            modalVisible: false,
            modalCamVisible: false,
            modalRecordVisiblue: false,
            currentTime: 0.0,
            recording: false,
            stoppedRecording: false,
            finished: false,
            audioPath: AudioUtils.DocumentDirectoryPath + '/test.aac',
            hasPermission: undefined,
        };
        this._images = [];
        this.onActionsPress = this.onActionsPress.bind(this);
        this.selectImages = this.selectImages.bind(this);
    }

    prepareRecordingPath(audioPath) {
        AudioRecorder.prepareRecordingAtPath(audioPath, {
            SampleRate: 22050,
            Channels: 1,
            AudioQuality: "Low",
            AudioEncoding: "aac",
            AudioEncodingBitRate: 32000
        });
    }
    componentDidMount() {
        this._checkPermission().then((hasPermission) => {
            this.setState({ hasPermission });

            if (!hasPermission) return;

            this.prepareRecordingPath(this.state.audioPath);

            AudioRecorder.onProgress = (data) => {
                this.setState({ currentTime: Math.floor(data.currentTime) });
            };

            AudioRecorder.onFinished = (data) => {
                // Android callback comes in the form of a promise instead.
                if (Platform.OS === 'ios') {
                    this._finishRecording(data.status === "OK", data.audioFileURL);
                }
            };
        });
    }
    _checkPermission() {
        if (Platform.OS !== 'android') {
            return Promise.resolve(true);
        }

        const rationale = {
            'title': 'Microphone Permission',
            'message': 'AudioExample needs access to your microphone so you can record audio.'
        };

        return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, rationale)
            .then((result) => {
                console.log('Permission result:', result);
                return (result === true || result === PermissionsAndroid.RESULTS.GRANTED);
            });
    }

    async _play() {
        if (this.state.recording) {
            await this._stop();
        }

        // These timeouts are a hacky workaround for some issues with react-native-sound.
        // See https://github.com/zmxv/react-native-sound/issues/89.
        setTimeout(() => {
            var sound = new Sound(this.state.audioPath, '', (error) => {
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

    async _record() {
        console.log('press in')
        if (this.state.recording) {
            console.warn('Already recording!');
            return;
        }

        if (!this.state.hasPermission) {
            console.warn('Can\'t record, no permission granted!');
            return;
        }

        if (this.state.stoppedRecording) {
            this.prepareRecordingPath(this.state.audioPath);
        }

        this.setState({ recording: true });

        try {
            const filePath = await AudioRecorder.startRecording();
        } catch (error) {
            console.error(error);
        }
    }
    async _stop() {
        console.log('press out')
        if (!this.state.recording) {
            console.warn('Can\'t stop, not recording!');
            return;
        }

        this.setState({ stoppedRecording: true, recording: false });

        try {
            const filePath = await AudioRecorder.stopRecording();

            if (Platform.OS === 'android') {
                this._finishRecording(true, filePath);
                this.props.onSend([
                    {
                        _id: 2,
                        audio: filePath,
                        createdAt: new Date(),
                        user: {
                            _id: 2,
                            name: 'React Native',
                            avatar: 'https://facebook.github.io/react/img/logo_og.png',
                        },
                    },
                ]);
                this.setModalRecordVisiblue(false);
            }
            return filePath;
        } catch (error) {
            throw error;
            // console.log(error);
            // console.error(error);
        }
    }

    _finishRecording(didSucceed, filePath) {
        this.setState({ finished: didSucceed });
        console.log(`Finished recording of duration ${this.state.currentTime} seconds at path: ${filePath}`);
    }

    takePicture = () => {
        this.camera.capture({})
            .then((data) => console.log(data))
            .catch(err => console.error(err));
        console.log('takePicture')
        console.log(this.camera)
        this.camera.capture()
            .then((data) => {
                console.log(data);
                this.props.onSend([
                    {
                        _id: 2,
                        image: data.path,
                        createdAt: new Date(),
                        user: {
                            _id: 2,
                            name: 'React Native',
                            avatar: 'https://facebook.github.io/react/img/logo_og.png',
                        },
                    },
                ]);
            })
            .catch(err => console.error(err));
        console.log('takePicture')
        this.setState({
            modalCamVisible: false
        })
    }
    switchType = () => {
        let newType;
        const { back, front } = Camera.constants.Type;

        if (this.state.camera.type === back) {
            newType = front;
        } else if (this.state.camera.type === front) {
            newType = back;
        }

        this.setState({
            camera: {
                ...this.state.camera,
                type: newType,
            },
        });
    }

    switchType = () => {
        let newType;
        const { back, front } = Camera.constants.Type;

        if (this.state.camera.type === back) {
            newType = front;
        } else if (this.state.camera.type === front) {
            newType = back;
        }

        this.setState({
            camera: {
                ...this.state.camera,
                type: newType,
            },
        });
    }


    setImages(images) {
        this._images = images;
        console.log('setImages', images)
    }

    getImages() {
        return this._images;
    }
    setModalCamVisible(visible) {
        this.setState({ modalCamVisible: visible });
    }
    setModalVisible(visible) {
        this.setState({ modalVisible: visible });
    }
    setModalRecordVisiblue(visible) {
        this.setState({ modalRecordVisiblue: visible })
    }

    onActionsPress() {
        const options = ['Choose From Library', 'Take Photo', 'Voice', 'Cancel'];
        const cancelButtonIndex = options.length - 1;
        this.context.actionSheet().showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        },
            (buttonIndex) => {
                switch (buttonIndex) {
                    case 0:
                        this.setModalVisible(true);
                        break;
                    case 1:
                        this.setModalCamVisible(true);
                        break;
                    case 2:
                        this.setModalRecordVisiblue(true);
                    default:
                }
            });
    }

    selectImages(images) {
        this.setImages(images);
    }

    renderNavBar() {
        return (
            <NavBar style={{
                statusBar: {
                    backgroundColor: '#FFF',
                },
                navBar: {
                    backgroundColor: '#FFF',
                },
            }}>
                <NavButton onPress={() => {
                    this.setModalVisible(false);
                }}>
                    <NavButtonText style={{
                        color: '#000',
                    }}>
                        {'Cancel'}
                    </NavButtonText>
                </NavButton>
                <NavTitle style={{
                    color: '#000',
                }}>
                    {'Camera Roll'}
                </NavTitle>
                <NavButton onPress={() => {
                    this.setModalVisible(false);

                    const images = this.getImages().map((image) => {
                        return {
                            image: image.uri,
                        };
                    });
                    console.log(images)
                    this.props.onSend(images);
                    this.setImages([]);
                }}>
                    <NavButtonText style={{
                        color: '#000',
                    }}>
                        {'Send'}
                    </NavButtonText>
                </NavButton>
            </NavBar >
        );
    }

    renderIcon() {
        if (this.props.icon) {
            return this.props.icon();
        }
        return (
            <View style={[styles.wrapper, this.props.wrapperStyle]} >
                <Text style={[styles.iconText, this.props.iconTextStyle]}>+</Text>

            </View>
        );
    }

    render() {
        return (
            <TouchableOpacity
                style={[styles.container, this.props.containerStyle]}
                onPress={this.onActionsPress}
            >
                <Modal
                    animationType={'slide'}
                    transparent={false}
                    visible={this.state.modalVisible}
                    onRequestClose={() => {
                        this.setModalVisible(false);
                    }}
                >
                    {this.renderNavBar()}
                    <CameraRollPicker
                        maximum={10}
                        imagesPerRow={4}
                        callback={this.selectImages}
                        selected={[]}
                    />
                </Modal>
                <Modal
                    animationType={'slide'}
                    transparent={false}
                    visible={this.state.modalCamVisible}
                    onRequestClose={() => {
                        this.setModalCamVisible(false);
                    }}

                >
                    <StatusBar
                        animated
                        hidden
                    />
                    <Camera
                        ref={(cam) => {
                            this.camera = cam;
                        }}
                        style={styles.preview}
                        aspect={this.state.camera.aspect}
                        captureTarget={this.state.camera.captureTarget}
                        type={this.state.camera.type}
                        flashMode={this.state.camera.flashMode}
                        defaultTouchToFocus
                        mirrorImage={false}
                    />
                    <View style={[styles.overlay, styles.topOverlay]}>
                        <TouchableOpacity
                            style={styles.typeButton}
                            onPress={this.switchType}
                        >
                            <Image
                                source={this.typeIcon}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.flashButton}
                            onPress={this.switchFlash}
                        >
                            <Image
                                source={this.flashIcon}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.overlay, styles.bottomOverlay]}>
                        {

                            <TouchableOpacity
                                style={styles.captureButton}
                                onPress={this.takePicture}
                            >
                                <Image
                                    source={require('./assets/ic_photo_camera_36pt.png')}
                                />
                            </TouchableOpacity>

                        }
                    </View>
                </Modal>
                <Modal
                    animationType={'slide'}
                    transparent={false}
                    visible={this.state.modalRecordVisiblue}
                    onRequestClose={() => {
                        this.setModalRecordVisiblue(false);
                    }}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                        <TouchableOpacity
                            onPressIn={() => this._record()}
                            onPressOut={() => this._stop()}
                            style={{ height: 200, width: '100%' }}>
                            <Image
                                style={{ width: 100, height: 80, alignSelf: 'center' }}
                                source={require('../images/icon_camera.png')}
                            />
                        </TouchableOpacity>
                    </View>
                </Modal>
                {this.renderIcon()}
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        width: 26,
        height: 26,
        marginLeft: 10,
        marginBottom: 10,
    },
    wrapper: {
        borderRadius: 13,
        borderColor: '#b2b2b2',
        borderWidth: 2,
        flex: 1,
    },
    iconText: {
        color: '#b2b2b2',
        fontWeight: 'bold',
        fontSize: 16,
        backgroundColor: 'transparent',
        textAlign: 'center',
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    overlay: {
        position: 'absolute',
        padding: 16,
        right: 0,
        left: 0,
        alignItems: 'center',
    },
    topOverlay: {
        top: 0,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bottomOverlay: {
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 40,
    },
    typeButton: {
        padding: 5,
    },
    flashButton: {
        padding: 5,
    },
    buttonsSpace: {
        width: 10,
    },
});

CustomActions.contextTypes = {
    actionSheet: React.PropTypes.func,
};

CustomActions.defaultProps = {
    sendImage: () => { },
    onSend: () => { },
    options: {},
    icon: null,
    containerStyle: {},
    wrapperStyle: {},
    iconTextStyle: {},
};

CustomActions.propTypes = {
    sendImage: React.PropTypes.func,
    onSend: React.PropTypes.func,
    options: React.PropTypes.object,
    icon: React.PropTypes.func,
    containerStyle: View.propTypes.style,
    wrapperStyle: View.propTypes.style,
    iconTextStyle: Text.propTypes.style,
};