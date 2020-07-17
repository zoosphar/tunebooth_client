import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import Feed from './Feed';
import Explore from './Explore';
import Upload from './Upload';
import Notifs from './Notifs';
import Profile from './Profile';

import Icon from 'react-native-vector-icons/FontAwesome';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar} from 'react-native';

class Home extends React.Component {
  componentDidMount() {
    StatusBar.setHidden(false);
    StatusBar.setBackgroundColor('#1c1c1c');
  }

  render() {
    const Tab = createBottomTabNavigator();
    return (
      <NavigationContainer
        style={{borderColor: 'black', position: 'fixed'}}
        independent={true}>
        <Tab.Navigator
          screenOptions={({route}) => ({
            tabBarIcon: ({focused, color, size}) => {
              let iconName;

              if (route.name === 'Feed') {
                iconName = 'home';
              } else if (route.name === 'Explore') {
                iconName = 'search';
              } else if (route.name === 'Upload') {
                iconName = 'plus';
              } else if (route.name === 'Notifs') {
                iconName = 'bell-o';
              } else if (route.name === 'Profile') {
                iconName = 'user-o';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
          })}
          tabBarOptions={{
            style: {
              backgroundColor: '#1c1c1c',
              borderTopColor: 'transparent',
              height: 50,
              paddingBottom: 2,
            },
            keyboardHidesTabBar: true,
            activeTintColor: 'white',
            inactiveTintColor: '#808080',
          }}>
          <Tab.Screen name="Feed" component={Feed} />
          <Tab.Screen name="Explore" component={Explore} />
          <Tab.Screen name="Upload" component={Upload} />
          <Tab.Screen name="Notifs" component={Notifs} />
          <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
      </NavigationContainer>
    );
  }
}

export default Home;
