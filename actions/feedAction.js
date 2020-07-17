import AsyncStorage from '@react-native-community/async-storage';
import Axios from 'axios';
import api from '../constants/api';
import {Toast} from 'native-base';

export const fetchNewPosts = fetchParams => {
  return (dispatch, getState) => {
    dispatch({
      type: 'FETCHING',
    });
    if (fetchParams.filterTune === 'all') {
      Axios.defaults.headers.common[
        'Authorization'
      ] = getState().authReducer.authToken;
      Axios.post(
        `${api.protocol}${api.baseUrl}${api.postRoute}${api.getPosts}`,
        fetchParams,
      )
        .then(async result => {
          console.log(result.data);
          await AsyncStorage.setItem('fetchFromServer', 'n');
          if (fetchParams.startingId) {
            dispatch({
              type: 'CONTINOUS_POSTS_FETCHED',
              payload: result.data,
            });
          } else {
            console.log('polling data', result.data[0].pollingData[0]);
            dispatch({
              type: 'NEW_POSTS_FETCHED',
              payload: result.data,
            });
          }
          dispatch({
            type: 'FETCHED',
          });
        })
        .catch(err => {
          console.log('error fetching posts: ', err);
          Toast.show({
            text: 'Error fetching new posts, Try Again',
            buttonText: 'Okay',
            duration: 5000,
            type: 'warning',
          });
          dispatch({
            type: 'FETCHED',
          });
        });
    }
    if (fetchParams.filterTune === 'tunes') {
      //   fetch tuned posts personally for the user
    }
  };
};

export const fetchPostsOnRefresh = () => {
  return (dispatch, getState) => {
    AsyncStorage.getItem('postFeedback').then(async data => {
      if (data !== null) {
        console.log('fetch posts on refresh');
        let updateData = JSON.parse(data);
        if (updateData.isUpdated === 'no') {
          Axios.defaults.headers.common[
            'Authorization'
          ] = getState().authReducer.authToken;
          Axios.post(
            `${api.protocol}${api.baseUrl}${api.postRoute}${
              api.updateFeedback
            }`,
            updateData,
          )
            .then(result => {
              console.log('fetch posts on refresh');
              dispatch({
                type: 'FETCHING',
              });
              Axios.post(
                `${api.protocol}${api.baseUrl}${api.postRoute}${api.getPosts}`,
                {
                  filterTune: 'all',
                  fetchLimitCount: 10,
                },
              ).then(result => {
                dispatch({
                  type: 'NEW_POSTS_FETCHED',
                  payload: result.data,
                });
                dispatch({
                  type: 'FETCHED',
                });
              });
              console.log('successfully updated feedback');
            })
            .catch(async err => {
              console.log(err);
              updateData.isUpdated = 'no';
              updateData = JSON.stringify(updateData);
              await AsyncStorage.setItem('postFeedback', updateData);
              Toast.show({
                text: 'Error while updating feedback, Try Again',
                buttonText: 'Okay',
                duration: 5000,
                type: 'danger',
              });
            });
          updateData.isUpdated = 'yes';
          updateData = JSON.stringify(updateData);
          await AsyncStorage.setItem('postFeedback', updateData);
        } else {
          dispatch({
            type: 'FETCHING',
          });
          Axios.post(
            `${api.protocol}${api.baseUrl}${api.postRoute}${api.getPosts}`,
            {
              filterTune: 'all',
              fetchLimitCount: 10,
            },
          ).then(result => {
            dispatch({
              type: 'NEW_POSTS_FETCHED',
              payload: result.data,
            });
            dispatch({
              type: 'FETCHED',
            });
          });
        }
      }
    });
  };
};

export const updateFeedback = () => {
  return (dispatch, getState) => {
    console.log('updating...');
    AsyncStorage.getItem('postFeedback').then(async data => {
      if (data !== null) {
        let updateData = JSON.parse(data);
        if (updateData.isUpdated === 'no') {
          Axios.defaults.headers.common[
            'Authorization'
          ] = getState().authReducer.authToken;
          Axios.post(
            `${api.protocol}${api.baseUrl}${api.postRoute}${
              api.updateFeedback
            }`,
            updateData,
          )
            .then(result => {
              console.log('successfully updated feedback');
            })
            .catch(async err => {
              console.log(err);
              updateData.isUpdated = 'no';
              updateData = JSON.stringify(updateData);
              await AsyncStorage.setItem('postFeedback', updateData);
              Toast.show({
                text: 'Error while updating feedback, Try Again',
                buttonText: 'Okay',
                duration: 5000,
                type: 'danger',
              });
            });
          updateData.isUpdated = 'yes';
          updateData = JSON.stringify(updateData);
          await AsyncStorage.setItem('postFeedback', updateData);
        }
      }
    });
  };
};
