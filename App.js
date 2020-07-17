import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  YellowBox,
  BackHandler,
  TextComponent,
  AppState,
} from 'react-native';
import Home from './screens/Home';
import Login from './screens/auth/Login';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Root} from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import {connect} from 'react-redux';
import {fetchToken} from './actions/authActions';
import {updateFeedback} from './actions/feedAction';

class App extends React.Component {
  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = nextAppState => {
    if (nextAppState === 'background') {
      this.props.updateFeedback();
      console.log('app state: ', nextAppState);
    }
  };

  UNSAFE_componentWillMount = () => {
    this.props.fetchToken('authToken');
  };

  storeData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
      await AsyncStorage.setItem('tokenDate', new Date().toString());
      this.props.fetchToken('authToken');
      return true;
    } catch (err) {
      console.log('error in setting item in async storage: ', err);
      return false;
    }
  };

  getData = async key => {
    let token;
    try {
      token = await AsyncStorage.getItem(key);
    } catch {
      console.log('error in getting item from async storage: ', err);
      return false;
    }
    return token;
  };

  render() {
    YellowBox.ignoreWarnings([
      'Animated: `useNativeDriver` was not specified. This is a required option and must be explicitly set to `true` or `false`',
    ]);
    const Stack = createStackNavigator();
    // console.log(AsyncStorage.getItem('authToken'), 'in render');
    console.log('in component', this.props.authToken, this.props.isFetched);
    return (
      <Root>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          {this.props.isFetched ? (
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                }}>
                {this.props.authToken === null ? (
                  <Stack.Screen name="Login">
                    {props => (
                      <Login
                        {...props}
                        getData={this.getData}
                        storeData={this.storeData}
                      />
                    )}
                  </Stack.Screen>
                ) : (
                  <Stack.Screen name="Home" component={Home} />
                )}
              </Stack.Navigator>
            </NavigationContainer>
          ) : (
            <></>
          )}
        </TouchableWithoutFeedback>
      </Root>
    );
  }
}

const mapStateToProps = state => {
  const authToken = state.authReducer.authToken;
  const isFetched = state.authReducer.isFetched;
  console.log(authToken);
  return {
    authToken,
    isFetched,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchToken: key => dispatch(fetchToken(key)),
    updateFeedback: () => dispatch(updateFeedback()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);
