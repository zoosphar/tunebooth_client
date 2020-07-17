import React from 'react';
import {
  StyleSheet,
  FlatList,
  Dimensions,
  View,
  Text,
  Image,
  RefreshControl,
  ScrollView,
  TouchableHighlightBase,
} from 'react-native';
import {Container, Toast, Spinner} from 'native-base';
import FeedCard from '../components/FeedCard';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import {
  fetchNewPosts,
  fetchPostsOnRefresh,
  updateFeedback,
} from '../actions/feedAction';
import {connect} from 'react-redux';

class Feed extends React.Component {
  state = {
    postFilter: 'all',
    currentItemIndex: 0,
  };

  componentDidMount() {
    const fetchParams = {
      filterTune: 'all',
      fetchLimitCount: 10,
    };
    this.props.fetchNewPosts(fetchParams);
  }

  cardSeperator = () => {
    return (
      <View
        style={{
          borderColor: '#363434',
          borderWidth: 0.5,
          width: '100%',
        }}
      />
    );
  };

  setCurrentIndex = currentItemIndex => {
    this.setState({
      currentItemIndex,
    });
  };
  render() {
    console.log('posts fetched: ', this.props.posts);
    return (
      <Container
        style={{
          backgroundColor: '#1c1c1c',
        }}>
        <View style={styles.postFilter}>
          <View>
            <Image
              style={{
                width: 30,
                height: 30,
              }}
              source={require('../assets/images/tunebooth_circle.png')}
            />
          </View>
          <View style={{display: 'flex', flexDirection: 'row'}}>
            <TouchableNativeFeedback
              onPress={() => {
                this.setState({
                  postFilter: 'all',
                });
              }}>
              <View
                style={{
                  padding: 5,
                  backgroundColor:
                    this.state.postFilter === 'all'
                      ? 'rgba(217, 123, 227, 0.3)'
                      : 'rgba(217, 123, 227, 0)',
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: '#D97BE3',
                  borderStyle: 'solid',
                  borderRightWidth: 0,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  width: 70,
                  alignItems: 'center',
                }}>
                <Text style={{fontSize: 13, color: 'white'}}>All Tunes</Text>
              </View>
            </TouchableNativeFeedback>
            <TouchableNativeFeedback
              onPress={() => {
                // this.setState({
                //   postFilter: 'tunes',
                // });
                Toast.show({
                  text: 'Your Tunes will be released soon',
                  buttonText: 'Okay',
                  duration: 5000,
                });
              }}>
              <View
                style={{
                  padding: 5,
                  backgroundColor:
                    this.state.postFilter === 'tunes'
                      ? 'rgba(217, 123, 227, 0.3)'
                      : 'rgba(217, 123, 227, 0)',
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: '#D97BE3',
                  borderStyle: 'solid',
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  width: 70,
                  alignItems: 'center',
                }}>
                <Text style={{fontSize: 13, color: '#636363'}}>Your Tunes</Text>
              </View>
            </TouchableNativeFeedback>
          </View>
        </View>
        {this.props.fetchingPosts ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
            }}>
            <Spinner color="white" size={45} />
          </View>
        ) : (
          <FlatList
            horizontal
            pagingEnabled={true}
            showsHorizontalScrollIndicator={false}
            legacyImplementation={false}
            refreshControl={
              <RefreshControl
                colors={['#D97BE3']}
                refreshing={false}
                onRefresh={() => {
                  this.props.fetchPostsOnRefresh();
                }}
              />
            }
            style={{
              width: '100%',
              height: '100%',
            }}
            data={this.props.posts}
            keyExtractor={item => item._id.toString()}
            renderItem={({item}) => <FeedCard item={item} />}
            viewabilityConfig={{
              waitForInteraction: true,
              viewAreaCoveragePercentThreshold: 95,
            }}
            onViewableItemsChanged={() => {
              console.log('updating feedback on server...');
              this.props.updateFeedback();
            }}
          />
        )}
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  postFilter: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    padding: 10,
  },
});

const mapDispatchToProps = dispatch => {
  return {
    fetchNewPosts: fetchParams => dispatch(fetchNewPosts(fetchParams)),
    fetchPostsOnRefresh: () => dispatch(fetchPostsOnRefresh()),
    updateFeedback: () => dispatch(updateFeedback()),
  };
};

const mapStateToProps = state => {
  return {
    posts: state.feedReducer.postsFetched,
    fetchingPosts: state.feedReducer.fetchingPosts,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Feed);
