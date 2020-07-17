const initState = {
  fetchingPosts: false,
  postsFetched: [],
};

const feedReducer = (state = initState, action) => {
  switch (action.type) {
    case 'NEW_POSTS_FETCHED':
      return {
        ...state,
        postsFetched: action.payload,
      };
    case 'CONTINUE_POSTS_FETCHED':
      let postsFetched = state.postsFetched;
      postsFetched.push(action.payload);
      return {
        ...state,
        postsFetched,
      };
    case 'FETCHING':
      return {
        ...state,
        fetchingPosts: true,
      };
    case 'FETCHED':
      return {
        ...state,
        fetchingPosts: false,
      };
    default:
      return state;
  }
};

export default feedReducer;
