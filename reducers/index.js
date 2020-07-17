import {combineReducers} from 'redux';
import authReducer from './authReducer';
import uploadReducer from './uploadReducer';
import feedReducer from './feedReducer';

export default combineReducers({
  authReducer,
  uploadReducer,
  feedReducer,
});
