import AsyncStorage from '@react-native-community/async-storage';
import Axios from 'axios';
import api from '../constants/api';

export const fetchToken = key => {
  return (dispatch, getState) => {
    AsyncStorage.getItem(key).then(item => {
      // console.log('action', item);
      if (item !== null) {
        // check if token is expired or not
        AsyncStorage.getItem('tokenDate').then(async date => {
          if (date) {
            let date1 = new Date(date);
            let date2 = new Date();
            let dateDiff =
              (date2.getTime() - date1.getTime()) / (1000 * 3600 * 24);
            if (dateDiff >= 14) {
              // token expired
              console.log('token expired, logging out...');
              dispatch({type: 'TOKEN_EXPIRED'});
              await AsyncStorage.removeItem('authToken');
            } else if (dateDiff >= 7) {
              // refresh token
              console.log('refreshing token...');
              const token = item;
              console.log(token);
              Axios.defaults.headers.common['Authorization'] = token;
              Axios.get(
                `${api.protocol}${api.baseUrl}${api.userRoute}${
                  api.refreshToken
                }`,
              )
                .then(async result => {
                  console.log('token refreshed!!', result.data.token);
                  await AsyncStorage.setItem('authToken', result.data.token);
                  const tokenDate = new Date().toString();
                  await AsyncStorage.setItem('tokenDate', tokenDate);
                  dispatch({
                    type: 'TOKEN_REFRESH',
                    payload: {token: result.data.token, tokenDate: tokenDate},
                  });
                })
                .catch(err => {
                  console.log('error refreshing token ---> ', err);
                });
            } else {
              // token success
              console.log('token fetched successfully', item);
              dispatch({type: 'TOKEN_SUCCESS', token: item});
            }
          } else {
            console.log('token date curropted, logging out...');
          }
        });
      } else {
        console.log('token currupted');
        dispatch({type: 'TOKEN_FAILURE'});
      }
    });
  };
};
