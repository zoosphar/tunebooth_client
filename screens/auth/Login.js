import React from 'react';
import {View, Text, Image, Keyboard} from 'react-native';
import {
  Container,
  Item,
  Input,
  Button,
  Toast,
  Spinner,
  Grid,
  Row,
  Col,
} from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';
import CountryPicker, {DARK_THEME} from 'react-native-country-picker-modal';
import styles from '../../styles/LoginStyles';
import api from '../../constants/api';

import axios from 'axios';
import {GoogleSignin} from 'react-native-google-signin';
import {
  AccessToken,
  GraphRequest,
  GraphRequestManager,
  LoginManager,
} from 'react-native-fbsdk';
import auth from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
// import Axios from '../../constants/axiosConfig';
import validator from 'validator';
import {connect} from 'react-redux';
import {fetchToken} from '../../actions/authActions';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';

class Login extends React.Component {
  state = {
    phone: 0,
    countryCallCode: '+91',
    countryCode: 'IN',
    googleUserInfo: null,
    isLoading: false,
    phoneConfirmResult: null,
    usernameScreen: false,
    interestScreen: false,
    interests: [],
    loginMethod: null,
    username: null,
    email: null,
    g_id: null,
    p_id: null,
    fb_id: null,
    authToken: null,
    isDeviceOnline: true,
  };

  componentDidMount() {
    // auth().signOut();
    GoogleSignin.configure({
      scopes: [],
      webClientId:
        '176184240391-97l8l6v77c9vqo5akmkmvgq8gjuafgpm.apps.googleusercontent.com',
      offlineAccess: true,
      hostedDomain: '',
      loginHint: '',
      forceConsentPrompt: true,
      accountName: '',
      iosClientId: '',
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        this.setState({
          isDeviceOnline: false,
        });
        Toast.show({
          text: 'We need Fuel, Connect to Internet!',
          buttonText: 'Okay',
          duration: 4000,
        });
      } else {
        this.setState({
          isDeviceOnline: true,
        });
      }
    });
  }

  handleInputChange = e => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  signInGoogle = async () => {
    try {
      if (!this.state.usernameScreen) {
        GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        this.setState(
          {
            googleUserInfo: userInfo,
            isLoading: true,
            username: userInfo.user.email.split('@')[0],
            email: userInfo.user.email,
            g_id: userInfo.user.id,
            loginMethod: 'G',
          },
          () => {
            console.log(this.state, userInfo.user.email.split('@')[0]);
          },
        );
      }
      axios
        .post(
          `${api.protocol}${api.baseUrl}${api.userRoute}${api.googleAuth}`,
          {
            username: this.state.username,
            email: this.state.email,
            g_id: this.state.g_id,
          },
        )
        .then(result => {
          Keyboard.dismiss();
          console.log('in post google');
          if (result.status === 200) {
            if (result.data.status === 'g_register success') {
              console.log('in register google');
              axios
                .post(
                  `${api.protocol}${api.baseUrl}${api.userRoute}${
                    api.googleAuth
                  }`,
                  {
                    username: this.state.username,
                    email: this.state.email,
                    g_id: this.state.g_id,
                  },
                )
                .then(result1 => {
                  this.setState({
                    interestScreen: true,
                    authToken: result1.data.token,
                  });
                })
                .catch(err => {
                  console.log(this.state);
                  console.log(
                    'error in login after registration',
                    err.response,
                  );
                });
            } else if (result.data.status === 'g_login success') {
              console.log('in login google');
              const storeStatus = this.props.storeData(
                'authToken',
                result.data.token,
              );
              if (!storeStatus) {
                Toast.show({
                  text: 'Something went wrong, Try Again',
                  buttonText: 'Okay',
                  duration: 3000,
                  type: 'danger',
                });
              } else {
                console.log('Stored auth token');
                this.setState({isLoading: false});
                // this.props.navigation.navigate('Home');
              }
            }
          }

          console.log('result', result);
        })
        .catch(err => {
          console.log('error occured!!');
          console.log('error', err.response);
          Keyboard.dismiss();
          if (err.status === 500) {
            Toast.show({
              text: "We're sorry Server Error, Try Again!",
              buttonText: 'Okay',
              duration: 4000,
              type: 'danger',
            });
          }
          if (
            this.state.usernameScreen &&
            err.response['data'].errors.username === 'Username Already Exists'
          ) {
            Toast.show({
              text: 'Username Exists, Try Another',
              buttonText: 'Okay',
              duration: 3000,
              type: 'warning',
            });
          } else if (
            err.response['data'].errors.username === 'Username Already Exists'
          ) {
            this.setState({
              usernameScreen: true,
            });
          } else if (
            err.response['data'].errors.email ===
            'fb_acc exists with same email'
          ) {
            Toast.show({
              text: 'Account linked with Facebook, Try Login with Facebook',
              buttonText: 'Okay',
              duration: 4000,
              type: 'danger',
            });
          }
          this.setState({isLoading: false});
        });
    } catch (error) {
      console.log('Error while login with Google');
    }
  };

  fbAuthRequest = () => {
    this.setState({isLoading: true, loginMethod: 'F'});
    console.log('in fb request...');
    axios
      .post(`${api.protocol}${api.baseUrl}${api.userRoute}${api.fbAuth}`, {
        username: this.state.username,
        email: this.state.email,
        fb_id: this.state.fb_id,
      })
      .then(result => {
        Keyboard.dismiss();
        if (result.status === 200) {
          if (result.data.status === 'fb_register success') {
            axios
              .post(
                `${api.protocol}${api.baseUrl}${api.userRoute}${api.fbAuth}`,
                {
                  username: this.state.username,
                  email: this.state.email,
                  fb_id: this.state.fb_id,
                },
              )
              .then(result1 => {
                this.setState({
                  interestScreen: true,
                  authToken: result1.data.token,
                });
              })
              .catch(err => {
                this.setState({isLoading: false});
                Toast.show({
                  text: 'Something went wrong, Try Again',
                  buttonText: 'Okay',
                  duration: 3000,
                  type: 'danger',
                });
                console.log(this.state);
                console.log('error in login after registration', err.response);
              });
          } else if (result.data.status === 'fb_login success') {
            const storeStatus = this.props.storeData(
              'authToken',
              result.data.token,
            );
            if (!storeStatus) {
              Toast.show({
                text: 'Something went wrong, Try Again',
                buttonText: 'Okay',
                duration: 3000,
                type: 'danger',
              });
              this.setState({isLoading: false});
            } else {
              console.log('Stored auth token');
              this.setState({isLoading: false});
              // this.props.navigation.navigate('Home');
            }
          }
        }
        console.log('result', result);
      })
      .catch(err => {
        console.log('error', err);
        Keyboard.dismiss();
        if (
          this.state.usernameScreen &&
          err.response['data'].errors.username === 'Username Already Exists'
        ) {
          Toast.show({
            text: 'Username Exists, Try Another',
            buttonText: 'Okay',
            duration: 5000,
            type: 'warning',
          });
        } else if (
          err.response['data'].errors.username === 'Username Already Exists'
        ) {
          this.setState({
            usernameScreen: true,
          });
        } else if (
          err.response['data'].errors.email === 'g_acc exists with same email'
        ) {
          Toast.show({
            text: 'Account linked with Google, Try Login with Google',
            buttonText: 'Okay',
            duration: 4000,
            type: 'danger',
          });
        }
        this.setState({isLoading: false});
        Toast.show({
          text: 'Something went wrong, Try Again',
          buttonText: 'Okay',
          duration: 3000,
          type: 'danger',
        });
      });
  };

  fbLogin = async () => {
    try {
      LoginManager.setLoginBehavior('native_with_fallback');
      await LoginManager.logInWithPermissions(['public_profile', 'email']).then(
        (result, error) => {
          if (result.isCancelled) {
            console.log('login cancelled');
          } else if (error) {
            console.log('Error while login');
          } else {
            console.log('accessing token');
            AccessToken.getCurrentAccessToken().then(data => {
              const infoRequest = new GraphRequest(
                '/me',
                {
                  accessToken: data.accessToken,
                  parameters: {
                    fields: {
                      string: 'email,name,first_name,last_name',
                    },
                  },
                },
                (error, result) => {
                  if (error) {
                    console.log('Error fetching data', error);
                  } else {
                    // Requrest to database for authentication
                    this.setState(
                      {
                        username: result.email.split('@')[0],
                        email: result.email,
                        fb_id: result.id,
                      },
                      () => {
                        this.fbAuthRequest();
                      },
                    );
                  }
                },
              );
              new GraphRequestManager().addRequest(infoRequest).start();
            });
          }
        },
      );
    } catch (error) {
      console.log(error);
    }
  };

  phoneAuthRequest = () => {
    this.setState({isLoading: true});
    axios
      .post(
        `${api.protocol}${api.baseUrl}${api.userRoute}${api.phoneAuthRegister}`,
        {
          username: this.state.username,
          phone: this.state.phone,
          p_id: this.state.p_id,
        },
      )
      .then(result => {
        Keyboard.dismiss();
        if (result.status === 200) {
          if (result.data.status === 'p_register success') {
            axios
              .post(
                `${api.protocol}${api.baseUrl}${api.userRoute}${
                  api.phoneAuthLogin
                }`,
                {
                  phone: this.state.phone,
                  p_id: this.state.p_id,
                },
              )
              .then(result1 => {
                this.setState({
                  interestScreen: true,
                  authToken: result1.data.token,
                });
              })
              .catch(err => {
                this.setState({isLoading: false});
                Toast.show({
                  text: 'Something went wrong, Try Again',
                  buttonText: 'Okay',
                  duration: 3000,
                  type: 'danger',
                });
                console.log(this.state);
                console.log('error in login after registration', err.response);
              });
          }
        }
      })
      .catch(error => {
        console.log('error', error);
        Keyboard.dismiss();
        if (
          this.state.usernameScreen &&
          error.response['data'].errors.username === 'Username Already Exists'
        ) {
          Toast.show({
            text: 'Username Exists, Try Another',
            buttonText: 'Okay',
            duration: 5000,
            type: 'warning',
          });
          return;
        }
        this.setState({isLoading: false});
        Toast.show({
          text: 'Something went wrong, Try Again',
          buttonText: 'Okay',
          duration: 3000,
          type: 'danger',
        });
      });
  };

  handlePhoneAuth = async () => {
    this.setState({isLoading: true});
    const {phone, countryCallCode} = this.state;
    // this.setState({});
    await auth()
      .signInWithPhoneNumber(countryCallCode + phone)
      .then(phoneConfirmResult => {
        this.setState({phoneConfirmResult});
      })
      .catch(error => {
        Toast.show({
          text: 'Error Sending OTP, Try Again!',
          buttonText: 'Okay',
          duration: 4000,
          type: 'danger',
        });
        this.setState({isLoading: false});
      });

    auth().onAuthStateChanged(user => {
      if (user) {
        // query the database for authentication
        axios
          .post(
            `${api.protocol}${api.baseUrl}${api.userRoute}${
              api.phoneAuthLogin
            }`,
            {
              phone: user.phoneNumber,
              p_id: user.uid,
            },
          )
          .then(result => {
            console.log('In login request');
            if (result.status === 200) {
              if (result.data.status === 'p_login success') {
                const storeStatus = this.props.storeData(
                  'authToken',
                  result.data.token,
                );
                if (!storeStatus) {
                  Toast.show({
                    text: 'Something went wrong, Try Again',
                    buttonText: 'Okay',
                    duration: 3000,
                    type: 'danger',
                  });
                  this.setState({isLoading: false});
                } else {
                  console.log('Stored auth token');
                  this.setState({isLoading: false});
                  // this.props.navigation.navigate('Home');
                }
              }
            }
          })
          .catch(error => {
            console.log(error, error.response['data']);
            if (error.response['data'].errors.user === 'user not exists') {
              this.setState(
                {
                  phone: user.phoneNumber,
                  p_id: user.uid,
                  usernameScreen: true,
                  isLoading: false,
                  loginMethod: 'P',
                },
                () => {
                  this.phoneAuthRequest();
                  console.log(this.state);
                },
              );
            }
          });
        console.log('User: ', user);
      } else {
        Toast.show({
          text: "Can't Login, Try Again",
          buttonText: 'Okay',
          duration: 4000,
          type: 'danger',
        });
      }
    });
  };

  updateInterest = interestName => {
    let interests = this.state.interests;
    let exist = false;
    interests.forEach(item => {
      if (item === interestName) {
        interests = interests.filter(item => item !== interestName);
        exist = true;
      }
    });
    if (!exist) {
      interests.push(interestName);
    }
    this.setState(
      {
        interests,
      },
      () => {
        console.log(this.state.interests);
      },
    );
  };

  completeSignup = () => {
    axios.defaults.headers.common['Authorization'] = this.state.authToken;
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    axios
      .post(
        `${api.protocol}${api.baseUrl}${api.profileRoute}${
          api.updateInterests
        }`,
        {
          interests: this.state.interests,
        },
      )
      .then(result => {
        const storeStatus = this.props.storeData(
          'authToken',
          result1.data.token,
        );
        if (!storeStatus) {
          Toast.show({
            text: 'Something went wrong, Try Again',
            buttonText: 'Okay',
            duration: 5000,
            type: 'danger',
          });
        } else {
          console.log('Stored auth token');
          this.setState({isLoading: false});
          // this.props.navigation.navigate('Home');
        }
      })
      .catch(err => {
        Toast.show({
          text: 'Apologies, Error creating your profile!',
          buttonText: 'Okay',
          duration: 5000,
          type: 'danger',
        });
        this.setState({isLoading: false});
      });
  };

  render() {
    return (
      <Container
        style={{
          backgroundColor: '#1c1c1c',
          display: 'flex',
          justifyContent: 'center',
          flexGrow: 1,
        }}
        onPress={Keyboard.dismiss}>
        {/* <Image
          style={{
            position: 'absolute',
            zIndex: 0,
            opacity: 0.3,
            width: '100%',
            height: '100%',
          }}
          source={require('../../assets/images/tunebooth_background.jpeg')}
        /> */}
        <View style={styles.content}>
          {this.state.isDeviceOnline ? (
            <React.Fragment>
              {!this.state.interestScreen && (
                <View style={styles.headerImageContainer}>
                  <Image
                    style={{
                      width: '100%',
                      height: 90,
                      transform: [{scale: 0.6}],
                    }}
                    source={require('../../assets/images/tunebooth_text.png')}
                  />
                </View>
              )}

              <View style={styles.loginForm}>
                {/* Username Screen */}
                {this.state.usernameScreen && (
                  <View style={{flexGrow: 1}}>
                    <Item>
                      <Input
                        maxLength={25}
                        style={{color: 'white'}}
                        name="username"
                        onChangeText={val => {
                          if ('/^[a-zA-Z0-9._]+$/'.test(val)) {
                            this.setState({username: val});
                          } else {
                            Toast.show({
                              text: "Username can't have this character",
                              buttonText: 'Okay',
                              duration: 4000,
                              type: 'warning',
                            });
                          }
                        }}
                        placeholder="Choose a Username"
                        disabled={this.state.isLoading}
                        placeholderTextColor="#c9c9c9"
                      />
                    </Item>
                    <Button
                      small
                      block
                      style={{
                        backgroundColor: '#D97BE3',
                        paddingTop: 20,
                        paddingBottom: 20,
                        marginTop: 30,
                      }}
                      disabled={this.state.isLoading}
                      onPress={() => {
                        if (this.state.loginMethod === 'F') {
                          this.fbAuthRequest();
                        } else if (this.state.loginMethod === 'G') {
                          this.signInGoogle();
                        } else if (this.state.loginMethod === 'P') {
                          this.phoneAuthRequest();
                        }
                      }}>
                      {this.state.isLoading ? (
                        <Spinner color="white" />
                      ) : (
                        <Text style={{color: 'white', fontSize: 22}}>
                          Continue
                        </Text>
                      )}
                    </Button>
                  </View>
                )}

                {/* Interest Screen */}
                {this.state.interestScreen && (
                  <React.Fragment>
                    <View
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: '900',
                          color: 'white',
                        }}>
                        Choose Your Interest
                      </Text>
                    </View>
                    <View
                      style={{
                        display: 'flex',
                        flexGrow: 1,
                        marginTop: 50,
                        justifyContent: 'center',
                      }}>
                      <Grid>
                        <Row style={{height: 150}}>
                          <Col
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 5,
                              backgroundColor: '#171717',
                              borderColor: this.state.interests.find(
                                item => item === 'music',
                              )
                                ? 'white'
                                : 'none',
                              borderWidth: this.state.interests.find(
                                item => item === 'music',
                              )
                                ? 1
                                : 0,
                            }}>
                            <TouchableNativeFeedback
                              onPress={() => {
                                this.updateInterest('music');
                              }}>
                              <View
                                style={{
                                  flex: 1,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}>
                                <Image
                                  style={{
                                    width: 100,
                                    height: 100,
                                  }}
                                  source={require('../../assets/icons/music_icon.png')}
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 15,
                                    marginTop: 10,
                                  }}>
                                  Music
                                </Text>
                              </View>
                            </TouchableNativeFeedback>
                          </Col>
                          <Col
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 5,
                              backgroundColor: '#171717',
                              marginRight: 20,
                              marginLeft: 20,
                              borderColor: this.state.interests.find(
                                item => item === 'poetry',
                              )
                                ? 'white'
                                : 'none',
                              borderWidth: this.state.interests.find(
                                item => item === 'poetry',
                              )
                                ? 1
                                : 0,
                            }}>
                            <TouchableNativeFeedback
                              onPress={() => {
                                this.updateInterest('poetry');
                              }}>
                              <View
                                style={{
                                  flex: 1,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}>
                                <Image
                                  style={{
                                    width: 100,
                                    height: 100,
                                  }}
                                  source={require('../../assets/icons/poetry_icon.png')}
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 15,
                                    marginTop: 10,
                                  }}>
                                  Poetry
                                </Text>
                              </View>
                            </TouchableNativeFeedback>
                          </Col>
                          <Col
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 5,
                              backgroundColor: '#171717',
                              borderColor: this.state.interests.find(
                                item => item === 'dance',
                              )
                                ? 'white'
                                : 'none',
                              borderWidth: this.state.interests.find(
                                item => item === 'dance',
                              )
                                ? 1
                                : 0,
                            }}>
                            <TouchableNativeFeedback
                              onPress={() => {
                                this.updateInterest('dance');
                              }}>
                              <View>
                                <Image
                                  style={{
                                    width: 100,
                                    height: 100,
                                  }}
                                  source={require('../../assets/icons/dance_icon.png')}
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 15,
                                    marginTop: 10,
                                    textAlign: 'center',
                                  }}>
                                  Dance
                                </Text>
                              </View>
                            </TouchableNativeFeedback>
                          </Col>
                        </Row>
                        <Row style={{height: 150, marginTop: 30}}>
                          <Col
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 5,
                              backgroundColor: '#171717',
                              borderColor: this.state.interests.find(
                                item => item === 'painting',
                              )
                                ? 'white'
                                : 'none',
                              borderWidth: this.state.interests.find(
                                item => item === 'painting',
                              )
                                ? 1
                                : 0,
                            }}>
                            <TouchableNativeFeedback
                              onPress={() => {
                                this.updateInterest('painting');
                              }}>
                              <View>
                                <Image
                                  style={{
                                    width: 100,
                                    height: 100,
                                  }}
                                  source={require('../../assets/icons/painting_icon.png')}
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 15,
                                    marginTop: 10,
                                    textAlign: 'center',
                                  }}>
                                  Painting
                                </Text>
                              </View>
                            </TouchableNativeFeedback>
                          </Col>
                          <Col
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 5,
                              backgroundColor: '#171717',
                              marginRight: 20,
                              marginLeft: 20,
                              borderColor: this.state.interests.find(
                                item => item === 'acting',
                              )
                                ? 'white'
                                : 'none',
                              borderWidth: this.state.interests.find(
                                item => item === 'acting',
                              )
                                ? 1
                                : 0,
                            }}>
                            <TouchableNativeFeedback
                              onPress={() => {
                                this.updateInterest('acting');
                              }}>
                              <View>
                                <Image
                                  style={{
                                    width: 100,
                                    height: 100,
                                  }}
                                  source={require('../../assets/icons/acting_icon.png')}
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 15,
                                    marginTop: 10,
                                    textAlign: 'center',
                                  }}>
                                  Acting
                                </Text>
                              </View>
                            </TouchableNativeFeedback>
                          </Col>
                          <Col
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 5,
                              backgroundColor: '#171717',
                              borderColor: this.state.interests.find(
                                item => item === 'storytelling',
                              )
                                ? 'white'
                                : 'none',
                              borderWidth: this.state.interests.find(
                                item => item === 'storytelling',
                              )
                                ? 1
                                : 0,
                            }}>
                            <TouchableNativeFeedback
                              onPress={() => {
                                this.updateInterest('storytelling');
                              }}>
                              <View>
                                <Image
                                  style={{
                                    width: 100,
                                    height: 100,
                                    justifyContent: 'center',
                                  }}
                                  source={require('../../assets/icons/storytelling_icon.png')}
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 15,
                                    marginTop: 10,
                                    textAlign: 'center',
                                  }}>
                                  Storytelling
                                </Text>
                              </View>
                            </TouchableNativeFeedback>
                          </Col>
                        </Row>
                        <Row style={{height: 150, marginTop: 30}}>
                          <Col
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 5,
                              backgroundColor: '#171717',
                              borderColor: this.state.interests.find(
                                item => item === 'sculpting',
                              )
                                ? 'white'
                                : 'none',
                              borderWidth: this.state.interests.find(
                                item => item === 'sculpting',
                              )
                                ? 1
                                : 0,
                            }}>
                            <TouchableNativeFeedback
                              onPress={() => {
                                this.updateInterest('sculpting');
                              }}>
                              <View>
                                <Image
                                  style={{
                                    width: 100,
                                    height: 100,
                                    justifyContent: 'center',
                                  }}
                                  source={require('../../assets/icons/sculpting_icon.png')}
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 15,
                                    marginTop: 10,
                                    textAlign: 'center',
                                  }}>
                                  Sculpting
                                </Text>
                              </View>
                            </TouchableNativeFeedback>
                          </Col>
                          <Col
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 5,
                              backgroundColor: '#171717',
                              marginRight: 20,
                              marginLeft: 20,
                              borderColor: this.state.interests.find(
                                item => item === 'shutterbug',
                              )
                                ? 'white'
                                : 'none',
                              borderWidth: this.state.interests.find(
                                item => item === 'shutterbug',
                              )
                                ? 1
                                : 0,
                            }}>
                            <TouchableNativeFeedback
                              onPress={() => {
                                this.updateInterest('shutterbug');
                              }}>
                              <View>
                                <Image
                                  style={{
                                    width: 100,
                                    height: 100,
                                    justifyContent: 'center',
                                  }}
                                  source={require('../../assets/icons/shutterbug_icon.png')}
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 15,
                                    marginTop: 10,
                                    textAlign: 'center',
                                  }}>
                                  Shutterbug
                                </Text>
                              </View>
                            </TouchableNativeFeedback>
                          </Col>
                          <Col
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 5,
                              backgroundColor: '#171717',
                              borderColor: this.state.interests.find(
                                item => item === 'graphics',
                              )
                                ? 'white'
                                : 'none',
                              borderWidth: this.state.interests.find(
                                item => item === 'graphics',
                              )
                                ? 1
                                : 0,
                            }}>
                            <TouchableNativeFeedback
                              onPress={() => {
                                this.updateInterest('graphics');
                              }}>
                              <View>
                                <Image
                                  style={{
                                    width: 100,
                                    height: 100,
                                    justifyContent: 'center',
                                  }}
                                  source={require('../../assets/icons/graphics_icon.png')}
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 15,
                                    marginTop: 10,
                                    textAlign: 'center',
                                  }}>
                                  Graphics
                                </Text>
                              </View>
                            </TouchableNativeFeedback>
                          </Col>
                        </Row>
                      </Grid>
                      <View style={{marginBottom: 30}}>
                        <Button
                          disabled={this.state.interests.length === 0}
                          onPress={this.completeSignup}
                          style={{
                            justifyContent: 'center',
                            backgroundColor:
                              this.state.interests.length === 0
                                ? '#8c8c8c'
                                : '#D97BE3',
                          }}>
                          {this.state.isLoading ? (
                            <Spinner color="white" />
                          ) : (
                            <Text
                              style={{
                                fontSize: 26,
                                fontWeight: '900',
                                color: 'white',
                              }}>
                              Continue
                            </Text>
                          )}
                        </Button>
                      </View>
                    </View>
                  </React.Fragment>
                )}
                {!this.state.usernameScreen && !this.state.interestScreen && (
                  <React.Fragment>
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <CountryPicker
                        style={{flexGrow: 2}}
                        theme={DARK_THEME}
                        countryCode={this.state.countryCode}
                        withFilter={true}
                        withFlag={true}
                        withCountryNameButton={false}
                        withCallingCode={true}
                        withCallingCodeButton={true}
                        // withEmoji={true}
                        onSelect={val => {
                          this.setState({
                            countryCode: val.cca2,
                            countryCallCode: val.callingCode[0],
                          });
                          console.log('country selection: ', val);
                        }}
                      />
                      <View style={{flexGrow: 1}}>
                        <Item style={{marginLeft: 10}}>
                          <Input
                            maxLength={10}
                            keyboardType="phone-pad"
                            style={{color: 'white'}}
                            name="phone"
                            onChangeText={val => this.setState({phone: val})}
                            placeholder="Phone Number"
                            disabled={this.state.isLoading}
                            placeholderTextColor="#c9c9c9"
                          />
                        </Item>
                      </View>
                    </View>

                    <View style={styles.loginButton}>
                      {/* empty{' '}r */}
                      <Button
                        small
                        block
                        style={{
                          backgroundColor:
                            this.state.isLoading ||
                            !validator.isMobilePhone(
                              this.state.phone.toString(),
                            ) ||
                            this.state.phone.toString().length !== 10
                              ? '#8c8c8c'
                              : '#D97BE3',
                          paddingTop: 20,
                          paddingBottom: 20,
                        }}
                        disabled={
                          this.state.isLoading ||
                          !validator.isMobilePhone(
                            this.state.phone.toString(),
                          ) ||
                          this.state.phone.toString().length !== 10
                        }
                        onPress={
                          this.state.isLoading ? null : this.handlePhoneAuth
                        }>
                        {this.state.isLoading &&
                        this.state.loginMethod === 'P' ? (
                          <Spinner color="white" />
                        ) : (
                          <Text style={{color: 'white', fontSize: 22}}>
                            Verify
                          </Text>
                        )}
                      </Button>
                      {/* Divider */}
                      <View
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 50,
                        }}>
                        <View
                          style={{
                            borderBottomColor: '#c9c9c9',
                            borderBottomWidth: 1,
                            padding: 1,
                            flexGrow: 1,
                          }}
                        />
                        <View>
                          <Text
                            style={{
                              color: '#c9c9c9',
                              marginRight: 10,
                              marginLeft: 10,
                            }}>
                            OR
                          </Text>
                        </View>
                        <View
                          style={{
                            borderBottomColor: '#c9c9c9',
                            borderBottomWidth: 1,
                            padding: 1,
                            flexGrow: 1,
                          }}
                        />
                      </View>
                      <View
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          width: '100%',
                          justifyContent: 'space-between',
                          marginTop: 50,
                          flexGrow: 1,
                          alignItems: 'center',
                        }}>
                        <Button
                          small
                          block
                          style={{
                            paddingTop: 20,
                            paddingBottom: 20,
                            backgroundColor: 'white',
                            width: '45%',
                          }}
                          disabled={this.state.isLoading}
                          onPress={
                            this.state.isLoading ? null : this.signInGoogle
                          }>
                          {this.state.isLoading &&
                          this.state.loginMethod === 'G' ? (
                            <Spinner color="#D97BE3" />
                          ) : (
                            <Icon
                              name="google"
                              size={25}
                              color="#4285F4"
                              style={{padding: 0}}
                            />
                          )}
                        </Button>
                        <Button
                          small
                          block
                          style={{
                            paddingTop: 20,
                            paddingBottom: 20,
                            width: '45%',
                          }}
                          disabled={this.state.isLoading}
                          onPress={this.state.isLoading ? null : this.fbLogin}>
                          {this.state.isLoading &&
                          this.state.loginMethod === 'F' ? (
                            <Spinner color="#D97BE3" />
                          ) : (
                            <Icon
                              name="facebook-f"
                              size={25}
                              color="white"
                              style={{padding: 0}}
                            />
                          )}
                        </Button>
                      </View>
                    </View>
                  </React.Fragment>
                )}
              </View>
            </React.Fragment>
          ) : (
            <View style={styles.headerImageContainer}>
              <Image
                style={{
                  width: 500,
                  height: 700,
                  transform: [{scale: 0.4}],
                }}
                source={require('../../assets/images/no_connection.png')}
              />
            </View>
          )}
        </View>
      </Container>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    fetchToken: key => dispatch(fetchToken(key)),
  };
};

export default connect(
  null,
  mapDispatchToProps,
)(Login);
