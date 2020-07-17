import AsyncStorage from '@react-native-community/async-storage';
import Axios from 'axios';
import api from '../constants/api';
import FormData from 'form-data';
import {Toast} from 'native-base';

export const uploadPost = (postData, navigationHandler) => {
  return (dispatch, getState) => {
    AsyncStorage.getItem('authToken').then(token => {
      console.log('fetched token');
      Axios.defaults.headers.common['Authorization'] = token;
      Axios.defaults.headers.common['Content-Type'] = 'multipart/form-data';
      console.log('initiating form');
      let data = new FormData();
      const mediaFile = {
        uri: `file://${postData.attachedMediaLocation}`,
        type: postData.attachedMediaType,
        name: `postData.attachedMediaName.${
          postData.attachedMediaType.split('/')[1]
        }`,
      };
      console.log('data', mediaFile);
      data.append('file', mediaFile);
      console.log('attached file');
      data.append('title', postData.title);
      data.append('description', postData.description);
      data.append('category', postData.category);
      data.append('isAnonymous', postData.isAnonymous);
      data.append('postType', postData.postType);
      data.append('pollOptions', postData.pollOptions);
      data.append('mediaType', postData.mediaType);
      data.append('isAttachmentMedia', postData.isAttachmentMedia);
      let uploadRoute = '';
      if (postData.mediaType === 'audio') {
        uploadRoute = api.audioUpload;
      } else if (postData.mediaType === 'video') {
        uploadRoute = api.videoUpload;
      } else if (postData.mediaType === 'image') {
        uploadRoute = api.imageUpload;
      }
      Axios.post(
        `${api.protocol}${api.baseUrl}${api.postRoute}${uploadRoute}`,
        data,
        {
          onUploadProgress: progressEvent => {
            const percentFraction = progressEvent.loaded / progressEvent.total;
            const percent = Math.floor(percentFraction * 100);
            console.log('uploaded: ', percent);
            if (percent % 10 === 0 && percent <= 90) {
              dispatch({
                type: 'UPDATE_PROGRESS',
                payload: {uploadProgress: percent},
              });
            }
            if (percent > 90) {
              dispatch({
                type: 'UPDATE_PROGRESS',
                payload: {uploadProgress: 90},
              });
            }
          },
        },
      )
        .then(async result => {
          console.log('upload success');
          dispatch({
            type: 'UPDATE_PROGRESS',
            payload: {uploadProgress: 100},
          });
          dispatch({
            type: 'UPLOAD_SUCCESS',
          });
          await setTimeout(() => {
            dispatch({
              type: 'SET_INITIAL_VALUE',
            });
            navigationHandler.navigate('Profile');
          }, 1000);
        })
        .catch(err => {
          console.log('error uploading: ', err);
          dispatch({
            type: 'UPLOAD_FAILED',
          });
          Toast.show({
            text: 'Error while creating Post, Try later',
            buttonText: 'Okay',
            duration: 6000,
            type: 'danger',
          });
        });
    });
  };
};
