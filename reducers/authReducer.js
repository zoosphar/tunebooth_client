const initState = {
  authToken: null,
  tokenDate: null,
  isFetched: false,
};

const authReducer = (state = initState, action) => {
  switch (action.type) {
    case 'TOKEN_SUCCESS':
      return {
        ...state,
        authToken: action.token,
        isFetched: true,
      };
    case 'TOKEN_FAILURE':
      return {
        ...state,
        isFetched: true,
      };
    case 'TOKEN_EXPIRED':
      return {
        ...state,
        authToken: null,
        tokenDate: null,
        isFetched: true,
      };
    case 'TOKEN_REFRESH':
      return {
        ...state,
        authToken: action.payload.token,
        isFetched: true,
        tokenDate: action.payload.tokenDate,
      };
    default:
      return state;
  }
};

export default authReducer;
