import React, {useRef} from 'react';
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  Image,
  Animated,
  Platform,
} from 'react-native';
import {Button, Spinner, Toast} from 'native-base';
import Video from 'react-native-video';
import MediaControls, {PLAYER_STATES} from 'react-native-media-controls';
import {
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
} from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/FontAwesome';
import {Rating, AirbnbRating} from 'react-native-ratings';
import AsyncStorage from '@react-native-community/async-storage';
import {updateFeedback} from '../actions/feedAction';
import {connect} from 'react-redux';

class FeedCard extends React.Component {
  state = {
    soundPlayInstance: null,
    currentTime: 0,
    duration: 0,
    audioPaused: true,
    audioSeekInterval: null,
    isFullScreen: false,
    isLoading: true,
    isBuffering: false,
    showControls: true,
    videoPaused: true,
    playerState: PLAYER_STATES.PAUSED,
    screenType: 'contain',
    imageMode: 'contain',
    showThumb: true,
    option1Value: '',
    option2Value: '',
    option3Value: '',
    option1: false,
    option2: false,
    option3: false,
    disablePolling: false,
    disableRating: false,
    rating: 0,
  };

  componentDidMount() {
    const {item} = this.props;
    if (item.postType === 'P' && item.pollingData.length !== 0) {
      this.setState({
        disablePolling: true,
      });
      if (item.pollingData[0].choosedOpts.includes(item.pollOptions[0])) {
        this.setState({
          option1: true,
        });
      }
      if (item.pollingData[0].choosedOpts.includes(item.pollOptions[1])) {
        this.setState({
          option2: true,
        });
      }
      if (item.pollingData[0].choosedOpts.includes(item.pollOptions[2])) {
        this.setState({
          option3: true,
        });
      }
    }
    if (item.postType === 'R' && item.ratingData.length !== 0) {
      this.setState({
        rating: item.ratingData[0].rating,
        disableRating: true,
      });
    }
  }

  onSeek = seek => {
    //Handler for change in seekbar
    if (seek.seekTime === undefined) {
      this.player.seek(parseInt(seek));
    } else {
      this.player.seek(parseInt(seek.seekTime));
    }
  };

  onPaused = playerState => {
    //Handler for Video Pause
    this.setState({
      videoPaused: !this.state.videoPaused,
      playerState,
    });
  };

  onProgress = data => {
    const {isLoading} = this.state;
    // Video Player will continue progress even if the video already ended
    if (!isLoading) {
      this.setState({currentTime: data.currentTime});
    }
  };

  onReplay = () => {
    //Handler for Replay

    this.setState({playerState: PLAYER_STATES.PLAYING}, () => {
      this.player.seek(0);
    });
  };

  // fadeAnim = useRef(new Animated.Value(this.state.showControls ? 1 : 0))
  //   .current;

  onLoad = data =>
    this.setState({
      duration: data.duration,
      isLoading: false,
    });

  onLoadStart = data => {
    console.log('loading', data);
    this.setState({isLoading: true, showControls: true});
  };

  onEnd = () =>
    this.setState({
      currentTime: 0,
      videoPaused: true,
    });

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

  togglePlay = () => {
    this.setState({
      videoPaused: !this.state.videoPaused,
      showControls: true,
    });
    // if (!this.state.videoPaused) {
    //   this.setState({
    //     showControls: false,
    //   });
    // }
  };

  collectFeedbackToCache = async () => {
    let feedbackData = {
      postId: this.props.item._id,
      feedbackType: this.props.item.postType,
      isUpdated: 'no',
    };
    if (this.props.item.postType === 'P') {
      let choosedOpts = [];
      if (this.state.option1Value !== '') {
        choosedOpts.push(this.state.option1Value);
      }
      if (this.state.option2Value !== '') {
        choosedOpts.push(this.state.option2Value);
      }
      if (this.state.option3Value !== '') {
        choosedOpts.push(this.state.option3Value);
      }
      feedbackData.choosedOpts = choosedOpts.join(',');
      if (choosedOpts.length !== 0) {
        await AsyncStorage.setItem(
          'postFeedback',
          JSON.stringify(feedbackData),
        );
      }
    }
    if (this.props.item.postType === 'R') {
      if (this.state.rating !== null) {
        feedbackData.rating = this.state.rating;
        await AsyncStorage.setItem(
          'postFeedback',
          JSON.stringify(feedbackData),
        );
      }
    }
  };

  ratingCompleted = () => {};
  render() {
    const {item} = this.props;
    return (
      <View style={styles.cardContainer}>
        {item.isAttachmentMedia ? (
          <React.Fragment>
            {item.mediaType === 'video' && (
              <TouchableWithoutFeedback
                style={{
                  height: 300,
                  backgroundColor: 'black',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Video
                  source={{
                    uri: `${item.mediaUrl}`,
                    cache: true,
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
                  playInBackground={true}
                  pictureInPicture={true}
                  paused={this.state.videoPaused}
                  poster={
                    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80'
                  }
                  posterResizeMode="contain"
                  // fullscreen={true}
                />

                <Animated.View
                  ref={ref => {
                    this.fadeAnim = new Animated.Value(1);
                  }}
                  onTouchEnd={() => {
                    if (!this.state.isLoading) {
                      this.setState(
                        {
                          showControls: !this.state.showControls,
                        },
                        () => {
                          Animated.timing(this.fadeAnim, {
                            toValue: this.state.showControls ? 0 : 1,
                            duration: 300,
                          }).start();
                        },
                      );
                    }
                  }}
                  style={{
                    // position: 'absolute',
                    flex: 1,
                    height: '100%',
                    width: '100%',
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    opacity: this.fadeAnim,
                  }}>
                  <View
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      height: '55%',
                    }}>
                    <View>
                      {this.state.isLoading ? (
                        <Spinner
                          color="white"
                          style={{
                            marginTop: -20,
                          }}
                        />
                      ) : (
                        <TouchableWithoutFeedback onPress={this.togglePlay}>
                          <Icon
                            name={this.state.videoPaused ? 'play' : 'pause'}
                            color="white"
                            size={35}
                          />
                        </TouchableWithoutFeedback>
                      )}
                    </View>
                    <Slider
                      style={{
                        width: Dimensions.get('screen').width,
                        height: 40,
                      }}
                      minimumValue={0}
                      maximumValue={parseInt(this.state.duration)}
                      step={1}
                      onTouchMove={val => {
                        val.bubbles = true;
                      }}
                      minimumTrackTintColor="#D97BE3"
                      maximumTrackTintColor="#636363"
                      value={
                        this.state.duration === 0 ||
                        this.state.currentTime === 0
                          ? 0
                          : this.state.currentTime
                      }
                      onValueChange={value => {
                        // this.state.soundPlayInstance.setCurrentTime(currentTime);
                        this.setState({
                          currentTime: value,
                        });
                      }}
                    />
                  </View>
                </Animated.View>

                {/* <MediaControls
              duration={this.state.duration}
              isLoading={this.state.isLoading}
              mainColor="#D97BE3"
              onFullScreen={this.onFullScreen}
              onPaused={this.onPaused}
              onReplay={this.onReplay}
              onSeek={this.onSeek}
              onSeeking={this.onSeeking}
              playerState={this.state.playerState}
              progress={this.state.currentTime}
              toolbar={this.renderToolbar()}
            /> */}
              </TouchableWithoutFeedback>
            )}
            {item.mediaType === 'audio' && (
              // <View
              //   style={{
              //     height: 300,
              //     backgroundColor: 'black',
              //     justifyContent: 'center',
              //     alignItems: 'center',
              //   }}
              // />
              <TouchableWithoutFeedback
                style={{
                  height: 300,
                  backgroundColor: '#1c1c1c',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Video
                  source={{
                    uri: `${item.mediaUrl}`,
                    cache: true,
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
                  playInBackground={true}
                  pictureInPicture={true}
                  paused={this.state.videoPaused}
                  poster={
                    'http://d2ier3jv5q4odo.cloudfront.net/image/audioIcon.png'
                  }
                  posterResizeMode="contain"
                  // fullscreen={true}
                />

                <Animated.View
                  ref={ref => {
                    this.fadeAnim = new Animated.Value(1);
                  }}
                  onTouchEnd={() => {
                    if (!this.state.isLoading) {
                      this.setState(
                        {
                          showControls: !this.state.showControls,
                        },
                        () => {
                          Animated.timing(this.fadeAnim, {
                            toValue: this.state.showControls ? 0 : 1,
                            duration: 500,
                          }).start();
                        },
                      );
                    }
                  }}
                  style={{
                    position: 'absolute',
                    flex: 1,
                    height: '100%',
                    width: '100%',
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    opacity: this.fadeAnim,
                  }}>
                  <View
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      height: '55%',
                    }}>
                    <View>
                      {this.state.isLoading ? (
                        <Spinner
                          color="white"
                          style={{
                            marginTop: -20,
                          }}
                        />
                      ) : (
                        <TouchableWithoutFeedback onPress={this.togglePlay}>
                          <Icon
                            name={this.state.videoPaused ? 'play' : 'pause'}
                            color="white"
                            size={35}
                          />
                        </TouchableWithoutFeedback>
                      )}
                    </View>
                    <Slider
                      style={{
                        width: Dimensions.get('screen').width,
                        height: 40,
                      }}
                      minimumValue={0}
                      maximumValue={parseInt(this.state.duration)}
                      step={1}
                      onTouchMove={val => {
                        val.bubbles = true;
                      }}
                      minimumTrackTintColor="#D97BE3"
                      maximumTrackTintColor="#636363"
                      value={
                        this.state.duration === 0 ||
                        this.state.currentTime === 0
                          ? 0
                          : this.state.currentTime
                      }
                      onValueChange={value => {
                        // this.state.soundPlayInstance.setCurrentTime(currentTime);
                        this.setState({
                          currentTime: value,
                        });
                      }}
                    />
                  </View>
                  {/* </TouchableWithoutFeedback> */}
                </Animated.View>

                {/* <MediaControls
              duration={this.state.duration}
              isLoading={this.state.isLoading}
              mainColor="#D97BE3"
              onFullScreen={this.onFullScreen}
              onPaused={this.onPaused}
              onReplay={this.onReplay}
              onSeek={this.onSeek}
              onSeeking={this.onSeeking}
              playerState={this.state.playerState}
              progress={this.state.currentTime}
              toolbar={this.renderToolbar()}
            /> */}
              </TouchableWithoutFeedback>
            )}
            {item.mediaType === 'image' && (
              <View
                style={{
                  height: 300,
                  backgroundColor: 'black',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  style={{
                    width: '100%',
                    height: 300,
                  }}
                  resizeMode="contain"
                  source={{
                    uri: `${item.mediaUrl}`,
                  }}
                />
              </View>
            )}
          </React.Fragment>
        ) : (
          <View>
            <Text>Link will be here</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={{padding: 10}}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Image
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                }}
                source={require('../assets/images/testProfilePic.png')}
              />
              <Text
                style={{
                  color: 'white',
                  fontSize: 22,
                  fontWeight: 'bold',
                  marginLeft: 3,
                }}>
                {item.username.username}
              </Text>
              <Text
                style={{
                  color: 'white',
                  fontSize: 22,
                  marginLeft: 5,
                  marginRight: 5,
                }}>
                •
              </Text>
              <Text style={{color: 'white', fontSize: 22}}>{item.title}</Text>
            </View>
            <Text style={{color: '#808080', fontSize: 16, marginTop: 20}}>
              {item.description}
            </Text>
          </View>
          <View style={styles.feedbackContainer}>
            {item.postType === 'R' && (
              <React.Fragment>
                <View
                  style={{
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 18,
                    }}>
                    Rating
                  </Text>
                  <Text
                    style={{
                      color: '#808080',
                      fontSize: 20,
                    }}>
                    {'  '}
                    {item.totalRatings}
                  </Text>
                </View>
                <AirbnbRating
                  count={5}
                  reviews={['Hmm!', 'OK', 'Good', 'Great', 'Amazing']}
                  defaultRating={this.state.rating}
                  size={30}
                  onFinishRating={val => {
                    if (this.state.disableRating) {
                      Toast.show({
                        text: "You've already Rated this post",
                        buttonText: 'Okay',
                        duration: 6000,
                        type: 'warning',
                      });
                      return;
                    }
                    this.setState(
                      {
                        rating: val,
                      },
                      () => {
                        this.collectFeedbackToCache();
                      },
                    );
                  }}
                />
              </React.Fragment>
            )}

            {item.postType === 'P' && (
              <React.Fragment>
                <View
                  style={{
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 18,
                    }}>
                    Polling
                  </Text>
                  <Text
                    style={{
                      color: '#808080',
                      fontSize: 20,
                    }}>
                    {'  '}
                    {item.totalPollings}
                  </Text>
                </View>
                <View
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  {item.pollOptions.length === 1 && (
                    <TouchableNativeFeedback
                      style={{
                        padding: 5,
                        width: 280,
                        borderColor: this.state.option1 ? 'white' : '#D97BE3',
                        borderStyle: 'solid',
                        borderWidth: 1,
                        marginBottom: 10,
                        borderRadius: 4,
                        backgroundColor: this.state.option1
                          ? 'white'
                          : 'rgba(0,0,0,0)',
                      }}
                      onPress={() => {
                        if (this.state.disablePolling) {
                          Toast.show({
                            text: "You've already Polled for this post",
                            buttonText: 'Okay',
                            duration: 5000,
                            type: 'warning',
                          });
                          return;
                        }
                        this.setState(
                          {
                            option1: !this.state.option1,
                          },
                          () => {
                            let option1Value = '';
                            if (this.state.option1) {
                              option1Value = item.pollOptions[0];
                            }
                            this.setState(
                              {
                                option1Value,
                              },
                              () => {
                                this.collectFeedbackToCache();
                              },
                            );
                          },
                        );
                      }}>
                      <Text
                        style={{
                          color: this.state.option1 ? '#1c1c1c' : 'white',
                          fontSize: 18,
                          textAlign: 'center',
                        }}>
                        {item.pollOptions[0]}
                      </Text>
                    </TouchableNativeFeedback>
                  )}
                  {item.pollOptions.length === 2 && (
                    <React.Fragment>
                      <TouchableNativeFeedback
                        style={{
                          padding: 5,
                          width: 280,
                          borderColor: this.state.option1 ? 'white' : '#D97BE3',
                          borderStyle: 'solid',
                          borderWidth: 1,
                          marginBottom: 10,
                          borderRadius: 4,
                          backgroundColor: this.state.option1
                            ? 'white'
                            : 'rgba(0,0,0,0)',
                        }}
                        onPress={() => {
                          if (this.state.disablePolling) {
                            Toast.show({
                              text: "You've already Polled for this post",
                              buttonText: 'Okay',
                              duration: 5000,
                              type: 'warning',
                            });
                            return;
                          }
                          this.setState(
                            {
                              option1: !this.state.option1,
                            },
                            () => {
                              let option1Value = '';
                              if (this.state.option1) {
                                option1Value = item.pollOptions[0];
                              }
                              this.setState(
                                {
                                  option1Value,
                                },
                                () => {
                                  this.collectFeedbackToCache();
                                },
                              );
                            },
                          );
                        }}>
                        <Text
                          style={{
                            color: this.state.option1 ? '#1c1c1c' : 'white',
                            fontSize: 18,
                            textAlign: 'center',
                          }}>
                          {item.pollOptions[0]}
                        </Text>
                      </TouchableNativeFeedback>
                      <TouchableNativeFeedback
                        style={{
                          padding: 5,
                          width: 280,
                          borderColor: this.state.option2 ? 'white' : '#D97BE3',
                          borderStyle: 'solid',
                          borderWidth: 1,
                          marginBottom: 10,
                          borderRadius: 4,
                          backgroundColor: this.state.option2
                            ? 'white'
                            : 'rgba(0,0,0,0)',
                        }}
                        onPress={() => {
                          if (this.state.disablePolling) {
                            Toast.show({
                              text: "You've already Polled for this post",
                              buttonText: 'Okay',
                              duration: 5000,
                              type: 'warning',
                            });
                            return;
                          }
                          this.setState(
                            {
                              option2: !this.state.option2,
                            },
                            () => {
                              let option2Value = '';
                              if (this.state.option2) {
                                option2Value = item.pollOptions[1];
                              }
                              this.setState(
                                {
                                  option2Value,
                                },
                                () => {
                                  this.collectFeedbackToCache();
                                },
                              );
                            },
                          );
                        }}>
                        <Text
                          style={{
                            color: this.state.option2 ? '#1c1c1c' : 'white',
                            fontSize: 18,
                            textAlign: 'center',
                          }}>
                          {item.pollOptions[1]}
                        </Text>
                      </TouchableNativeFeedback>
                    </React.Fragment>
                  )}
                  {item.pollOptions.length === 3 && (
                    <React.Fragment>
                      <TouchableNativeFeedback
                        style={{
                          padding: 5,
                          width: 280,
                          borderColor: this.state.option1 ? 'white' : '#D97BE3',
                          borderStyle: 'solid',
                          borderWidth: 1,
                          marginBottom: 10,
                          borderRadius: 4,
                          backgroundColor: this.state.option1
                            ? 'white'
                            : 'rgba(0,0,0,0)',
                        }}
                        onPress={() => {
                          if (this.state.disablePolling) {
                            Toast.show({
                              text: "You've already Polled for this post",
                              buttonText: 'Okay',
                              duration: 5000,
                              type: 'warning',
                            });
                            return;
                          }
                          this.setState(
                            {
                              option1: !this.state.option1,
                            },
                            () => {
                              let option1Value = '';
                              if (this.state.option1) {
                                option1Value = item.pollOptions[0];
                              }
                              this.setState(
                                {
                                  option1Value,
                                },
                                () => {
                                  this.collectFeedbackToCache();
                                },
                              );
                            },
                          );
                        }}>
                        <Text
                          style={{
                            color: this.state.option1 ? '#1c1c1c' : 'white',
                            fontSize: 18,
                            textAlign: 'center',
                          }}>
                          {item.pollOptions[0]}
                        </Text>
                      </TouchableNativeFeedback>
                      <TouchableNativeFeedback
                        style={{
                          padding: 5,
                          width: 280,
                          borderColor: this.state.option2 ? 'white' : '#D97BE3',
                          borderStyle: 'solid',
                          borderWidth: 1,
                          marginBottom: 10,
                          borderRadius: 4,
                          backgroundColor: this.state.option2
                            ? 'white'
                            : 'rgba(0,0,0,0)',
                        }}
                        onPress={() => {
                          if (this.state.disablePolling) {
                            Toast.show({
                              text: "You've already Polled for this post",
                              buttonText: 'Okay',
                              duration: 5000,
                              type: 'warning',
                            });
                            return;
                          }
                          this.setState(
                            {
                              option2: !this.state.option2,
                            },
                            () => {
                              let option2Value = '';
                              if (this.state.option2) {
                                option2Value = item.pollOptions[1];
                              }
                              this.setState(
                                {
                                  option2Value,
                                },
                                () => {
                                  this.collectFeedbackToCache();
                                },
                              );
                            },
                          );
                        }}>
                        <Text
                          style={{
                            color: this.state.option2 ? '#1c1c1c' : 'white',
                            fontSize: 18,
                            textAlign: 'center',
                          }}>
                          {item.pollOptions[1]}
                        </Text>
                      </TouchableNativeFeedback>
                      <TouchableNativeFeedback
                        style={{
                          padding: 5,
                          width: 280,
                          borderColor: this.state.option3 ? 'white' : '#D97BE3',
                          borderStyle: 'solid',
                          borderWidth: 1,
                          marginBottom: 10,
                          borderRadius: 4,
                          backgroundColor: this.state.option3
                            ? 'white'
                            : 'rgba(0,0,0,0)',
                        }}
                        onPress={() => {
                          if (this.state.disablePolling) {
                            Toast.show({
                              text: "You've already Polled for this post",
                              buttonText: 'Okay',
                              duration: 5000,
                              type: 'warning',
                            });
                            return;
                          }
                          this.setState(
                            {
                              option3: !this.state.option3,
                            },
                            () => {
                              let option3Value = '';
                              if (this.state.option3) {
                                option3Value = item.pollOptions[2];
                              }
                              this.setState(
                                {
                                  option3Value,
                                },
                                () => {
                                  this.collectFeedbackToCache();
                                },
                              );
                            },
                          );
                        }}>
                        <Text
                          style={{
                            color: this.state.option3 ? '#1c1c1c' : 'white',
                            fontSize: 18,
                            textAlign: 'center',
                          }}>
                          {item.pollOptions[2]}
                        </Text>
                      </TouchableNativeFeedback>
                    </React.Fragment>
                  )}
                </View>
              </React.Fragment>
            )}
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  cardContainer: {
    width: Dimensions.get('screen').width,
    height: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#1c1c1c',
    // height: Dimensions.get('screen').height - 77,
  },
  cardContent: {
    flex: 1,
  },
  feedbackContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
    padding: 10,
  },
});

const mapDispatchToProps = dispatch => {
  return {
    updateFeedback: feedbackParams => dispatch(updateFeedback(feedbackParams)),
  };
};

export default connect(
  null,
  mapDispatchToProps,
)(FeedCard);
