const initState = {
  uploadProgress: 0,
  isUploaded: false,
  isUploading: false,
  uploadFailed: false,
};

const uploadReducer = (state = initState, action) => {
  switch (action.type) {
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        uploadProgress: action.payload.uploadProgress,
        isUploading: true,
      };
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        isUploaded: true,
        isUploading: false,
      };
    case 'UPLOAD_FAILED':
      return {
        ...state,
        uploadFailed: true,
        isUploading: false,
      };
    case 'SET_INITIAL_VALUE':
      return {
        ...state,
        uploadProgress: 0,
        isUploading: false,
        isUploaded: false,
        uploadFailed: false,
      };
    default:
      return state;
  }
};

export default uploadReducer;
