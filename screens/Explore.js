import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import Video from 'react-native-video';
import MediaControls, {PLAYER_STATES} from 'react-native-media-controls';
import RNUrlPreview from 'react-native-url-preview';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import {WebView} from 'react-native-webview';

class Explore extends React.Component {
  state = {
    currentTime: 0,
    duration: 0,
    isFullScreen: false,
    isLoading: true,
    paused: true,
    playerState: PLAYER_STATES.PAUSED,
    screenType: 'contain',
  };

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
        {' '}
        New Light | John Mayer{' '}
      </Text>
    </View>
  );
  onSeeking = currentTime => this.setState({currentTime});

  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center'}}>
        {/* <TouchableWithoutFeedback
          style={{
            height: 350,
            backgroundColor: 'black',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={this.handleTap}>
          <Video
            source={{
              uri:
                '/storage/emulated/0/WhatsApp/Media/WhatsApp Video/VID-20200430-WA0012.mp4',
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

        <TouchableWithoutFeedback
          onPress={() => {
            console.log('Pressed the url Preview');
          }}>
          <RNUrlPreview
            text={'this is my video, https://www.instagram.com/p/B_sjvx5ls0T/'}
          />
        </TouchableWithoutFeedback> */}

        {/* <View
          style={{
            flex: 1,
          }}>
          <WebView
            source={{
              uri: 'https://www.instagram.com/p/B_sjvx5ls0T/',
            }}
          />
        </View> */}
      </View>
    );
  }
}

export default Explore;
