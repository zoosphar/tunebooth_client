import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  content: {
    display: 'flex',
    flexGrow: 1,
    zIndex: 2,
  },
  loginForm: {
    display: 'flex',
    justifyContent: 'flex-start',
    flexGrow: 1,
    paddingLeft: 35,
    paddingRight: 35,
    marginTop: 30,
  },
  loginButton: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  footerContent: {
    top: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  headerImageContainer: {
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

export default styles;
