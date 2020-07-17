module.exports = {
  protocol: 'http://',
  baseUrl: '192.168.43.153:5000/api/',
  // ----------------- users routes -----------------------
  userRoute: 'users/',
  phoneAuthLogin: 'phoneAuthLogin',
  googleAuth: 'googleAuth',
  fbAuth: 'fbAuth',
  phoneAuthRegister: 'phoneAuthRegister',
  refreshToken: 'refreshToken',
  // -----------------------------------------------------

  // ----------------- posts routes -----------------------
  postRoute: 'posts/',
  imageUpload: 'newImagePost',
  audioUpload: 'newAudioPost',
  videoUpload: 'newVideoPost',
  getPosts: 'getPosts',
  updateFeedback: 'updateFeedback',

  // -----------------------------------------------------

  // ----------------- profiles routes -----------------------
  profileRoute: 'profiles/',
  updateInterests: 'updateInterests',
  // --------------------------------------------------------
};
