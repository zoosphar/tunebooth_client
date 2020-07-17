import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  PermissionsAndroid,
  TextInput,
  Image,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {Button, Form, Item, Switch, Toast, ActionSheet} from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';
import validator from 'validator';

import DocumentPicker from 'react-native-document-picker';
import Sound from 'react-native-sound';
import Video from 'react-native-video';
import MediaControls, {PLAYER_STATES} from 'react-native-media-controls';

import RNGRP from 'react-native-get-real-path';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
} from 'react-native-gesture-handler';
import RNUrlPreview from 'react-native-url-preview';
import Axios from 'axios';
import {uploadPost} from '../actions/uploadAction';
import api from '../constants/api';
import {connect} from 'react-redux';
import Animated from 'react-native-reanimated';

Sound.setCategory('Playback');

const categoryOptions = [
  'Music',
  'Poetry',
  'Dance',
  'Painting',
  'Acting',
  'Storytelling',
  'Sculpting',
  'Shutterbug',
  'Graphics',
];

class Upload extends React.Component {
  state = {
    isMediaLoaded: false,
    showPreview: false,
    attachedMediaLocation: null,
    attachedMediaType: null,
    attachedMediaName: '',
    attachedMediaSize: null,
    attachedFile: null,
    feedbackMethod: 'rating',
    isPostReady: false,
    pollOptions: 1,
    soundPlayInstance: null,
    currentTime: 0,
    duration: 0,
    audioPaused: true,
    audioSeekInterval: null,
    isFullScreen: false,
    isLoading: true,
    paused: true,
    playerState: PLAYER_STATES.PAUSED,
    screenType: 'contain',
    externalLink: '',
    externalLinkPreview: '',
    mediaCDNLink: '',
    title: '',
    description: '',
    postAnonymous: false,
    feedbackMethod: 'rating',
    pollOption1: '',
    pollOption2: '',
    pollOption3: '',
    imageMode: 'contain',
    category: null,
  };
  requestStorageReadPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Tunebooth Storage Permission',
          message: 'Give permission to read the files from the storage',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Read Permission granted');
      } else {
        console.log('Permission Denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  handleAttachment = async () => {
    try {
      await this.requestStorageReadPermission();

      this.setState({
        externalLink: '',
      });

      const res = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.audio,
          DocumentPicker.types.video,
          DocumentPicker.types.images,
        ],
      });

      this.setState({
        attachedFile: res,
      });

      console.log('file type: ', res.type);
      const supportedMedia =
        'video/mp4|audio/mp3|audio/wav|audio/aac|audio/mpeg|image/jpg|image/jpeg|image/png';
      if (!supportedMedia.includes(res.type)) {
        Toast.show({
          text: 'Media file not supported',
          buttonText: 'Okay',
          duration: 6000,
          type: 'warning',
        });
        return;
      }
      if (res.size / 1000000 > 30 && res.type.includes('video/mp4')) {
        Toast.show({
          text: 'Video Size must be less than 30 MB',
          buttonText: 'Okay',
          duration: 6000,
          type: 'warning',
        });
        return;
      }
      if (res.size / 1000000 > 5 && res.type.includes('audio')) {
        Toast.show({
          text: 'Audio Size must be less than 5 MB',
          buttonText: 'Okay',
          duration: 6000,
          type: 'warning',
        });
        return;
      }
      if (res.size / 1000000 > 5 && res.type.includes('image')) {
        Toast.show({
          text: 'Image Size must be less than 5 MB',
          buttonText: 'Okay',
          duration: 6000,
          type: 'warning',
        });
        return;
      }

      await RNGRP.getRealPathFromURI(res.uri).then(async filePath => {
        console.log('FilePath: ', filePath);
        console.log(res.name, res.type);
        let imageMode = 'contain';
        if (res.type.includes('image')) {
          await Image.getSize(`file://${filePath}`, (width, height) => {
            if (height < width) {
              console.log('mode changed');
              imageMode = 'cover';
            }
          });
          this.setState({
            attachedMediaName: res.name,
            attachedMediaSize: res.size,
            attachedMediaLocation: filePath,
            attachedMediaType: res.type,
            isMediaLoaded: true,
            showPreview: true,
            imageMode,
          });
          return;
        }

        if (res.type.includes('audio')) {
          let soundPlay = new Sound(filePath, null, error => {
            console.log('hey there');
            if (error) {
              console.log('Failed to load the sound', error);
              return;
            }
            this.setState({
              soundPlayInstance: soundPlay,
              duration: Number(soundPlay.getDuration()),
            });
          });
        }
        this.setState({
          attachedMediaName: res.name,
          attachedMediaSize: res.size,
          attachedMediaLocation: filePath,
          attachedMediaType: res.type,
          isMediaLoaded: true,
          showPreview: true,
        });
      });
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('canceled file picker');
      } else {
        throw err;
      }
    }
  };
  // ------------------ Media Controls Begin ----------------------
  onSeek = seek => {
    //Handler for change in seekbar
    this.player.seek(seek);
  };

  onPaused = playerState => {
    //Handler for Video Pause
    this.setState({
      paused: !this.state.paused,
      playerState,
    });
  };

  onProgress = data => {
    const {isLoading, playerState} = this.state;
    // Video Player will continue progress even if the video already ended
    if (!isLoading && playerState !== PLAYER_STATES.ENDED) {
      this.setState({currentTime: data.currentTime});
    }
  };

  onReplay = () => {
    //Handler for Replay
    this.setState({playerState: PLAYER_STATES.PLAYING});
    this.videoPlayer.seek(0);
  };

  onLoad = data => this.setState({duration: data.duration, isLoading: false});

  onLoadStart = data => this.setState({isLoading: true});

  onEnd = () => this.setState({playerState: PLAYER_STATES.ENDED});

  onError = () => console.log('Oh! ', error);

  onFullScreen = () => {
    if (this.state.screenType == 'contain')
      this.setState({screenType: 'cover'});
    else this.setState({screenType: 'contain'});
  };

  renderToolbar = () => (
    <View>
      <Text style={{color: 'white', fontSize: 20}}>
        {this.state.title === '' ? 'Title of your post' : this.state.title}
      </Text>
    </View>
  );
  onSeeking = currentTime => this.setState({currentTime});
  // ------------------ Media Controls End ----------------------

  audioPlayPause = () => {
    this.setState({
      audioPaused: !this.state.audioPaused,
    });
    console.log('playing/pausing');
    if (this.state.audioPaused) {
      let audioSeekInterval = setInterval(async () => {
        console.log('in the loop');
        await this.state.soundPlayInstance.getCurrentTime(seconds => {
          console.log('updating time here');
          this.setState({
            currentTime: seconds,
          });
          if (
            parseInt(this.state.currentTime) ===
            parseInt(this.state.duration) - 1
          ) {
            console.log('end');
            this.setState({
              audioPaused: true,
              currentTime: 0,
            });
            clearInterval(this.state.audioSeekInterval);
            console.log(this.state.currentTime, this.state.audioPaused);
          }
        });
        console.log(
          parseInt(this.state.currentTime),
          parseInt(this.state.duration),
          parseInt(this.state.currentTime) === parseInt(this.state.duration),
        );
      }, 1000);
      this.setState({
        audioSeekInterval,
      });
      this.state.soundPlayInstance.play();
    } else {
      clearInterval(this.state.audioSeekInterval);
      this.state.soundPlayInstance.pause();
    }
  };

  publishPost = () => {
    if (
      (this.state.attachedMediaLocation === null ||
        this.state.attachedMediaLocation === '') &&
      this.state.externalLink.trim() === ''
    ) {
      Toast.show({
        text: 'Please attach a valid Media or Link',
        buttonText: 'Okay',
        duration: 6000,
        type: 'danger',
      });
      return;
    }
    if (this.state.title.trim() === '') {
      Toast.show({
        text: 'Please enter a Title for post',
        buttonText: 'Okay',
        duration: 6000,
        type: 'danger',
      });
      return;
    }
    if (this.state.description.trim() === '') {
      Toast.show({
        text: 'Please enter a Short Description for post',
        buttonText: 'Okay',
        duration: 6000,
        type: 'danger',
      });
      return;
    }
    if (this.state.category === null) {
      Toast.show({
        text: 'Please choose a Category for post',
        buttonText: 'Okay',
        duration: 6000,
        type: 'danger',
      });
      return;
    }
    if (
      this.state.feedbackMethod === 'poll' &&
      this.state.pollOptions === 1 &&
      this.state.pollOption1.trim() === ''
    ) {
      Toast.show({
        text: 'Please fill the Poll Option',
        buttonText: 'Okay',
        duration: 6000,
        type: 'danger',
      });
      return;
    }
    if (
      this.state.feedbackMethod === 'poll' &&
      this.state.pollOptions === 2 &&
      (this.state.pollOption1.trim() === '' ||
        this.state.pollOption2.trim() === '')
    ) {
      Toast.show({
        text: 'Please fill all the Poll Options',
        buttonText: 'Okay',
        duration: 6000,
        type: 'danger',
      });
      return;
    }
    if (
      this.state.feedbackMethod === 'poll' &&
      this.state.pollOptions === 3 &&
      (this.state.pollOption1.trim() === '' ||
        this.state.pollOption2.trim() === '' ||
        this.state.pollOption3.trim() === '')
    ) {
      Toast.show({
        text: 'Please fill all the Poll Options',
        buttonText: 'Okay',
        duration: 6000,
        type: 'danger',
      });
      return;
    }

    // upload the post based on it's type
    let postData = {};
    postData.title = this.state.title;
    postData.description = this.state.description;
    postData.category = this.state.category.toLowerCase();
    postData.isAnonymous = this.state.postAnonymous.toString();
    if (this.state.feedbackMethod === 'rating') {
      postData.postType = 'R';
    }
    if (this.state.feedbackMethod === 'poll') {
      postData.postType = 'P';
      let pollOptions = '';
      if (this.state.pollOption1 !== '') {
        pollOptions = `${this.state.pollOption1}`;
      }
      if (this.state.pollOption2 !== '') {
        pollOptions = pollOptions + `, ${this.state.pollOption2}`;
      }
      if (this.state.pollOption3 !== '') {
        pollOptions = pollOptions + `, ${this.state.pollOption3}`;
      }
      postData.pollOptions = pollOptions;
    }
    if (this.state.feedbackMethod === 'basic') {
      postData.postType = 'B';
    }
    if (this.state.externalLink.trim() !== '') {
      postData.isAttachmentMedia = 'false';
      postData.linkUrl = this.state.externalLink;
    } else {
      postData.isAttachmentMedia = 'true';
      postData.attachedMediaLocation = this.state.attachedMediaLocation;
      postData.attachedMediaName = this.state.attachedMediaName;
      postData.attachedMediaType = this.state.attachedMediaType;
      if (this.state.attachedMediaType.includes('audio')) {
        postData.mediaType = 'audio';
      }
      if (this.state.attachedMediaType.includes('video')) {
        postData.mediaType = 'video';
      }
      if (this.state.attachedMediaType.includes('image')) {
        postData.mediaType = 'image';
      }
    }
    console.log('uploading post', postData);

    this.props.uploadPost(postData, this.props.navigation);
  };

  render() {
    return (
      <React.Fragment>
        {this.props.isUploading || this.props.isUploaded ? (
          <View style={styles.progressContainer}>
            <View>
              <Text style={styles.progressText}>
                Optimizing & Uploading your Post...
              </Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: '#D97BE3',
                  borderRadius: 10,
                  width: `${this.props.uploadProgress}%`,
                }}
              />
            </View>
            <View>
              <Text style={styles.progressCountText}>
                {this.props.uploadProgress}%
              </Text>
            </View>
          </View>
        ) : (
          <React.Fragment>
            <View style={styles.headerContainer}>
              <Text style={styles.headerStyle}>New Post</Text>
              <Button
                small
                style={{
                  backgroundColor: '#D97BE3',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 10,
                  borderRadius: 3,
                }}
                onPress={this.publishPost}>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 20,
                    textAlignVertical: 'top',
                  }}>
                  Publish
                </Text>
              </Button>
            </View>
            <View
              style={{
                backgroundColor: '#141414',
                justifyContent: 'flex-start',
                display: this.state.showPreview ? 'flex' : 'none',
                padding: 10,
              }}>
              {/* to display the video preview */}
              {this.state.isMediaLoaded &&
                this.state.showPreview &&
                this.state.attachedMediaType.includes('video') && (
                  <TouchableWithoutFeedback
                    style={{
                      height: 300,
                      backgroundColor: 'black',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 4,
                    }}>
                    <Video
                      source={{
                        uri: this.state.attachedMediaLocation,
                      }}
                      ref={ref => {
                        this.player = ref;
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        borderRadius: 4,
                      }}
                      volume={1.0}
                      resizeMode={this.state.screenType}
                      onFullScreen={this.state.isFullScreen}
                      onEnd={this.onEnd}
                      onLoad={this.onLoad}
                      onLoadStart={this.onLoadStart}
                      onProgress={this.onProgress}
                      paused={this.state.paused}
                      // fullscreen={true}
                    />
                    <MediaControls
                      duration={this.state.duration}
                      isLoading={this.state.isLoading}
                      mainColor="#1c1c1c"
                      onFullScreen={this.onFullScreen}
                      onPaused={this.onPaused}
                      onReplay={this.onReplay}
                      onSeek={this.onSeek}
                      onSeeking={this.onSeeking}
                      playerState={this.state.playerState}
                      progress={this.state.currentTime}
                      toolbar={this.renderToolbar()}
                    />
                  </TouchableWithoutFeedback>
                )}

              {/* to display the image preview */}
              {this.state.isMediaLoaded &&
                this.state.showPreview &&
                this.state.attachedMediaType.includes('image') && (
                  <View>
                    <Image
                      style={{
                        // width: '100%',
                        height: 250,
                      }}
                      resizeMode={this.state.imageMode}
                      source={{
                        uri: `file://${this.state.attachedMediaLocation}`,
                      }}
                    />
                  </View>
                )}

              {/* to display the audio preview */}
              {this.state.isMediaLoaded &&
                this.state.showPreview &&
                this.state.attachedMediaType.includes('audio') && (
                  <View style={styles.audioPlayerContainer}>
                    {/* play/pause button */}
                    <View>
                      <TouchableWithoutFeedback onPress={this.audioPlayPause}>
                        <Icon
                          name={this.state.audioPaused ? 'play' : 'pause'}
                          color="white"
                          size={27}
                        />
                      </TouchableWithoutFeedback>
                    </View>
                    {/* seek bar */}
                    <View>
                      <Slider
                        style={{width: 350, height: 40}}
                        minimumValue={0}
                        maximumValue={1}
                        minimumTrackTintColor="#D97BE3"
                        maximumTrackTintColor="#636363"
                        value={
                          this.state.duration === 0 ||
                          this.state.currentTime === 0
                            ? 0
                            : this.state.currentTime / this.state.duration
                        }
                        onValueChange={value => {
                          let currentTime = Number(value * this.state.duration);
                          this.state.soundPlayInstance.setCurrentTime(
                            currentTime,
                          );
                          this.setState({
                            currentTime,
                          });
                        }}
                      />
                      <Text
                        style={{
                          color: '#636363',
                          marginLeft: 10,
                          marginTop: 30,
                          position: 'absolute',
                        }}>
                        {this.state.attachedMediaName
                          .toString()
                          .substring(0, 30)}
                        ... •{' '}
                        {(this.state.attachedMediaSize / 1000000).toFixed(2)} MB
                      </Text>
                    </View>
                  </View>
                )}
              {/* to dislpay the external link preview */}
              {!this.state.isMediaLoaded && this.state.showPreview && (
                <TouchableWithoutFeedback
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    Toast.show({
                      text: 'External Link opens on a published post',
                      buttonText: 'Okay',
                      duration: 4000,
                    });
                  }}>
                  <RNUrlPreview
                    text={('Loading Preview', this.state.externalLinkPreview)}
                  />
                </TouchableWithoutFeedback>
              )}
            </View>
            <KeyboardAwareScrollView
              keyboardShouldPersistTaps="handled"
              style={{
                backgroundColor: '#1c1c1c',
                flex: 1,
                // display: this.state.displayMedia ? 'none' : 'flex',
              }}>
              <View style={styles.content}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10,
                  }}>
                  <View>
                    <Text
                      style={{
                        color: '#636363',
                        marginRight: 10,
                        marginLeft: 10,
                        fontSize: 18,
                      }}>
                      MEDIA
                    </Text>
                  </View>
                  <View
                    style={{
                      borderBottomColor: '#636363',
                      borderBottomWidth: 1,
                      padding: 1,
                      flexGrow: 1,
                    }}
                  />
                </View>
                <View style={styles.mediaSection}>
                  <View style={styles.mediaOptions}>
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        // alignItems: 'center',
                      }}>
                      <Item style={styles.inputWrapper}>
                        <TextInput
                          removeClippedSubviews={false}
                          placeholder="External Link (e.g. https://youtu.be/w3lc0m3)"
                          placeholderTextColor="#808080"
                          textAlignVertical="bottom"
                          value={this.state.externalLink}
                          selectTextOnFocus={true}
                          style={styles.inputStyles}
                          onChangeText={val => {
                            if (validator.isEmpty(val)) {
                              this.setState({
                                showPreview: false,
                              });
                            }
                            this.setState({
                              externalLink: val,
                            });
                          }}
                        />
                      </Item>
                      <View
                        style={{
                          flexGrow: 0,
                          marginTop: 20,
                          display:
                            this.state.externalLink !== '' &&
                            validator.isURL(this.state.externalLink)
                              ? 'flex'
                              : 'none',
                        }}>
                        <Button
                          small
                          bordered
                          style={{
                            borderColor: '#D97BE3',
                            paddingRight: 5,
                            paddingLeft: 5,
                            marginLeft: 10,
                          }}
                          onPress={() => {
                            this.setState({
                              isMediaLoaded: false,
                              showPreview: true,
                              externalLinkPreview: this.state.externalLink,
                            });
                          }}>
                          <Icon name="arrow-right" size={20} color="white" />
                        </Button>
                      </View>
                    </View>
                    {/* Divider Begin */}
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 20,
                      }}>
                      <View
                        style={{
                          padding: 1,
                          flexGrow: 1,
                        }}
                      />
                      <View>
                        <Text
                          style={{
                            color: '#636363',
                            marginRight: 10,
                            marginLeft: 10,
                            fontSize: 16,
                          }}>
                          OR
                        </Text>
                      </View>
                      <View
                        style={{
                          padding: 1,
                          flexGrow: 1,
                        }}
                      />
                    </View>
                    {/* Divider End */}

                    <Button
                      onPress={this.handleAttachment}
                      style={{
                        borderColor: '#D97BE3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        marginTop: 20,
                      }}
                      bordered
                      small>
                      <Icon name="paperclip" size={18} color={'white'} />
                      <Text
                        style={{
                          color: 'white',
                          marginLeft: 10,
                        }}>
                        {this.state.isMediaLoaded ? 'Change' : 'Attach'} Media
                      </Text>
                    </Button>
                  </View>
                </View>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10,
                  }}>
                  <View>
                    <Text
                      style={{
                        color: '#636363',
                        marginRight: 10,
                        marginLeft: 10,
                        fontSize: 18,
                      }}>
                      DETAILS
                    </Text>
                  </View>
                  <View
                    style={{
                      borderBottomColor: '#636363',
                      borderBottomWidth: 1,
                      padding: 1,
                      flexGrow: 1,
                    }}
                  />
                </View>
                <Form style={styles.uploadForm}>
                  <Item style={styles.inputWrapper}>
                    <TextInput
                      placeholder="Title of your post"
                      placeholderTextColor="#808080"
                      textAlignVertical="bottom"
                      selec
                      maxLength={75}
                      style={styles.inputStyles}
                      value={this.state.title}
                      onChangeText={val => {
                        this.setState({
                          title: val,
                        });
                      }}
                    />
                    <Text style={{marginTop: 15, color: '#808080'}}>
                      {75 - this.state.title.length} / 75
                    </Text>
                  </Item>
                  <Item style={styles.inputWrapper}>
                    <TextInput
                      placeholder="Short Description about your post"
                      placeholderTextColor="#808080"
                      textAlignVertical="bottom"
                      maxLength={150}
                      style={styles.inputStyles}
                      value={this.state.description}
                      onChangeText={val => {
                        this.setState({
                          description: val,
                        });
                      }}
                    />
                    <Text style={{marginTop: 15, color: '#808080'}}>
                      {150 - this.state.description.length} / 150
                    </Text>
                  </Item>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 20,
                    }}>
                    <TouchableNativeFeedback
                      onPress={() => {
                        ActionSheet.show(
                          {
                            options: categoryOptions,
                            cancelButtonIndex: 9,
                            title: 'Choose a Category',
                          },
                          optionIndex => {
                            let category = '';
                            if (
                              optionIndex === 9 &&
                              this.state.category === null
                            ) {
                              category = null;
                            }
                            if (
                              optionIndex === 9 &&
                              this.state.category !== null
                            ) {
                              category = this.state.category;
                            }
                            if (optionIndex !== 9) {
                              category = categoryOptions[optionIndex];
                            }
                            this.setState({
                              category: category,
                            });
                          },
                        );
                      }}>
                      <View style={styles.categoryButton}>
                        <Text
                          style={{
                            color:
                              this.state.category === null
                                ? '#636363'
                                : 'white',
                          }}>
                          {this.state.category === null
                            ? 'Category'
                            : this.state.category}
                        </Text>
                        {this.state.category !== null &&
                          this.state.category === 'Music' && (
                            <Image
                              style={{
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                              }}
                              source={require(`../assets/icons/music_icon.png`)}
                            />
                          )}
                        {this.state.category !== null &&
                          this.state.category === 'Dance' && (
                            <Image
                              style={{
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                              }}
                              source={require(`../assets/icons/dance_icon.png`)}
                            />
                          )}
                        {this.state.category !== null &&
                          this.state.category === 'Poetry' && (
                            <Image
                              style={{
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                              }}
                              source={require(`../assets/icons/poetry_icon.png`)}
                            />
                          )}
                        {this.state.category !== null &&
                          this.state.category === 'Storytelling' && (
                            <Image
                              style={{
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                              }}
                              source={require(`../assets/icons/storytelling_icon.png`)}
                            />
                          )}
                        {this.state.category !== null &&
                          this.state.category === 'Sculpting' && (
                            <Image
                              style={{
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                              }}
                              source={require(`../assets/icons/sculpting_icon.png`)}
                            />
                          )}
                        {this.state.category !== null &&
                          this.state.category === 'Acting' && (
                            <Image
                              style={{
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                              }}
                              source={require(`../assets/icons/acting_icon.png`)}
                            />
                          )}
                        {this.state.category !== null &&
                          this.state.category === 'Shutterbug' && (
                            <Image
                              style={{
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                              }}
                              source={require(`../assets/icons/shutterbug_icon.png`)}
                            />
                          )}
                        {this.state.category !== null &&
                          this.state.category === 'Graphics' && (
                            <Image
                              style={{
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                              }}
                              source={require(`../assets/icons/graphics_icon.png`)}
                            />
                          )}
                        {this.state.category !== null &&
                          this.state.category === 'Painting' && (
                            <Image
                              style={{
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                              }}
                              source={require(`../assets/icons/painting_icon.png`)}
                            />
                          )}
                      </View>
                    </TouchableNativeFeedback>
                    <View style={styles.switchContainer}>
                      <Switch
                        trackColor={{false: '#767577', true: '#D97BE3'}}
                        thumbColor={
                          this.state.postAnonymous ? '#636363' : '#f4f3f4'
                        }
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => {
                          this.setState({
                            postAnonymous: !this.state.postAnonymous,
                          });
                        }}
                        value={this.state.postAnonymous}
                      />
                      <Text
                        style={{color: 'white', marginTop: 8}}
                        onPress={() => {
                          this.setState({
                            postAnonymous: !this.state.postAnonymous,
                          });
                        }}>
                        Post Anonymously
                      </Text>
                    </View>
                  </View>
                </Form>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10,
                  }}>
                  <View>
                    <Text
                      style={{
                        color: '#636363',
                        marginRight: 10,
                        marginLeft: 10,
                        fontSize: 18,
                      }}>
                      OPTIONS
                    </Text>
                  </View>
                  <View
                    style={{
                      borderBottomColor: '#636363',
                      borderBottomWidth: 1,
                      padding: 1,
                      flexGrow: 1,
                    }}
                  />
                </View>
                <View style={styles.optionContainer}>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      paddingRight: 20,
                      paddingLeft: 20,
                    }}>
                    <View
                      style={{
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: '#D97BE3',
                        borderStyle: 'solid',
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        backgroundColor:
                          this.state.feedbackMethod === 'basic'
                            ? 'rgba(217, 123, 227, 0.3)'
                            : 'rgba(217, 123, 227, 0)',
                        flexGrow: 1,
                      }}>
                      <TouchableWithoutFeedback
                        style={{
                          padding: 10,
                        }}
                        onPress={() => {
                          this.setState({
                            feedbackMethod: 'basic',
                          });
                        }}>
                        <Text
                          style={{
                            color: 'white',
                            fontSize: 16,
                            textAlign: 'center',
                          }}>
                          Basic
                        </Text>
                      </TouchableWithoutFeedback>
                    </View>
                    <View
                      style={{
                        borderWidth: 1,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                        borderColor: '#D97BE3',
                        borderStyle: 'solid',
                        backgroundColor:
                          this.state.feedbackMethod === 'rating'
                            ? 'rgba(217, 123, 227, 0.3)'
                            : 'rgba(217, 123, 227, 0)',
                        flexGrow: 1,
                      }}>
                      <TouchableWithoutFeedback
                        style={{
                          padding: 10,
                        }}
                        onPress={() => {
                          this.setState({
                            feedbackMethod: 'rating',
                          });
                        }}>
                        <Text
                          style={{
                            color: 'white',
                            fontSize: 16,
                            textAlign: 'center',
                          }}>
                          Rating
                        </Text>
                      </TouchableWithoutFeedback>
                    </View>
                    <View
                      style={{
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: '#D97BE3',
                        borderStyle: 'solid',
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        backgroundColor:
                          this.state.feedbackMethod === 'poll'
                            ? 'rgba(217, 123, 227, 0.3)'
                            : 'rgba(217, 123, 227, 0)',
                        flexGrow: 1,
                      }}>
                      <TouchableWithoutFeedback
                        style={{
                          padding: 10,
                        }}
                        onPress={() => {
                          this.setState({
                            feedbackMethod: 'poll',
                          });
                        }}>
                        <Text
                          style={{
                            color: 'white',
                            fontSize: 16,
                            textAlign: 'center',
                          }}>
                          &nbsp;&nbsp; Poll &nbsp;&nbsp;
                        </Text>
                      </TouchableWithoutFeedback>
                    </View>
                  </View>

                  <View
                    style={{
                      padding: 20,
                      flex: 1,
                    }}>
                    {this.state.feedbackMethod === 'basic' && (
                      <View style={styles.ratingInfo}>
                        <Text style={{color: 'white', fontSize: 16}}>
                          There will be no rating or polling on post
                        </Text>
                      </View>
                    )}
                    {this.state.feedbackMethod === 'rating' && (
                      <View style={styles.ratingInfo}>
                        <Text style={{color: 'white', fontSize: 16}}>
                          Users will be able to rate your post out of 5 stars.
                        </Text>
                      </View>
                    )}
                    {this.state.feedbackMethod === 'poll' && (
                      <React.Fragment>
                        <Text style={{color: 'white', marginBottom: 10}}>
                          Add polls to your post
                        </Text>
                        {this.state.pollOptions === 1 ||
                        this.state.pollOptions === 2 ||
                        this.state.pollOptions === 3 ? (
                          <TextInput
                            style={styles.pollText}
                            autoFocus
                            value={this.state.pollOption1}
                            onChangeText={val => {
                              this.setState({
                                pollOption1: val,
                              });
                            }}
                          />
                        ) : null}

                        {this.state.pollOptions === 2 ||
                        this.state.pollOptions === 3 ? (
                          <TextInput
                            style={styles.pollText}
                            autoFocus
                            value={this.state.pollOption2}
                            onChangeText={val => {
                              this.setState({
                                pollOption2: val,
                              });
                            }}
                          />
                        ) : null}

                        {this.state.pollOptions === 3 ? (
                          <TextInput
                            style={styles.pollText}
                            autoFocus
                            value={this.state.pollOption3}
                            onChangeText={val => {
                              this.setState({
                                pollOption3: val,
                              });
                            }}
                          />
                        ) : null}

                        <View
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          {this.state.pollOptions < 3 ? (
                            // Add Poll Button
                            <Button
                              bordered
                              onPress={() => {
                                if (this.state.pollOptions < 3) {
                                  this.setState({
                                    pollOptions: this.state.pollOptions + 1,
                                  });
                                }
                              }}
                              style={{borderColor: '#D97BE3', padding: 15}}>
                              <Icon
                                name="plus"
                                size={20}
                                style={{color: 'white'}}
                              />
                            </Button>
                          ) : null}

                          {this.state.pollOptions > 1 ? (
                            // Remove Poll Button
                            <Button
                              bordered
                              onPress={() => {
                                if (this.state.pollOptions > 1) {
                                  this.setState({
                                    pollOptions: this.state.pollOptions - 1,
                                  });
                                }
                              }}
                              style={{
                                borderColor: '#e34222',
                                padding: 15,
                                marginLeft:
                                  this.state.pollOptions === 2 ? 10 : 0,
                              }}>
                              <Icon
                                name="minus"
                                size={20}
                                style={{color: 'white'}}
                              />
                            </Button>
                          ) : null}
                        </View>
                      </React.Fragment>
                    )}
                  </View>
                </View>
              </View>
            </KeyboardAwareScrollView>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1c1c1c',
  },
  progressText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressCountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  progressBar: {
    width: '75%',
    height: 10,
    backgroundColor: '#808080',
    borderRadius: 10,
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1c1c1c',
  },
  headerStyle: {
    color: 'white',
    fontSize: 28,
    textAlign: 'center',
  },
  categoryButton: {
    width: 100,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 4,
    borderColor: '#D97BE3',
    borderRadius: 50,
  },
  content: {
    display: 'flex',
    zIndex: 2,
  },
  uploadForm: {
    display: 'flex',
    justifyContent: 'flex-start',
    flexGrow: 1,
    padding: 10,
    paddingTop: 0,
  },
  inputWrapper: {
    marginLeft: 0,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputStyles: {
    color: 'white',
  },
  switchContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  mediaSection: {
    display: 'flex',
    padding: 10,
    flexDirection: 'row',
  },
  mediaOptions: {
    display: 'flex',
    flexGrow: 1,
    marginBottom: 10,
  },
  mediaPreview: {
    flexGrow: 2,
  },
  mediaThumb: {},
  mediaName: {
    color: 'white',
    fontSize: 16,
  },
  mediaSize: {
    color: 'white',
    fontSize: 12,
  },
  mediaType: {
    color: 'white',
    fontSize: 12,
  },
  mediaUploadBtn: {
    borderColor: '#D97BE3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    marginTop: 20,
  },
  audioPlayerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 10,
  },
  optionContainer: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'space-around',
    marginTop: 20,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pollText: {
    height: 30,
    textAlignVertical: 'center',
    marginBottom: 20,
    padding: 0,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  ratingInfo: {
    marginTop: 40,
    padding: 15,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: 'rgba(74, 168, 50, 1)',
    borderRadius: 4,
    backgroundColor: 'rgba(74, 168, 50, 0.2)',
  },
});

const mapStateToProps = state => {
  return {
    uploadProgress: state.uploadReducer.uploadProgress,
    isUploaded: state.uploadReducer.isUploaded,
    isUploading: state.uploadReducer.isUploading,
    uploadFailed: state.uploadReducer.uploadFailed,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    uploadPost: (postData, navigationHandler) =>
      dispatch(uploadPost(postData, navigationHandler)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Upload);
