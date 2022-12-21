import React, { useContext } from 'react';
import {Text, StyleSheet, View, TouchableOpacity, Image} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay/lib';
import { AuthContext } from '../../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';

const UserInfoScreen = ({navigation}) => {
  const {userInfo, isLoading, logout} = useContext(AuthContext);

  const switchToSettingScteen = async () => {
    navigation.navigate('Setting', { name: 'Setting' });
  };

  return (
    <React.Fragment>
      <View style={styles.container}>
        <View style={styles.wrapper}>
          <Spinner visible={isLoading} />
          <Text style={styles.name}>{userInfo.user.name}</Text>
          <Image style={styles.icon} source={require('../../configs/icon.png')} />
          <Text style={styles.corporation}>{userInfo.user.corporation}</Text>
          <Text style={styles.permission}>{userInfo.user.permission}</Text>
          <TouchableOpacity onPress={() => {}} style={[styles.group]}>
            <Text style={[styles.text]}>
              {'使用者管理'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={[styles.group]}>
            <Text style={[styles.text]}>
              {'編輯個人資料'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={[styles.group]}>
            <Text style={[styles.text]}>
              {'修改密碼'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={[styles.group]}>
            <Text style={[styles.text]}>
              {'登出'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: '80%',
  },
  name: {
    alignSelf:'center',
    height: 44,
    fontStyle: 'normal',
    fontSize: 36,
    lineHeight: 44,
    color: '#000000'
  },
  icon: {
    marginTop:10,
    alignSelf:'center',
    width: 157,
    height: 157,
    borderRadius:157/2,
    borderColor:'black',
    borderWidth:2

  },
  corporation:{
    marginTop:10,
    alignSelf:'center',
    height: 34,
    fontStyle: 'normal',
    fontSize: 28,
    lineHeight: 34,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  permission:{
    alignSelf:'center',
    height: 34,
    fontStyle: 'normal',
    fontSize: 28,
    lineHeight: 34,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom:60
  },
  group:{
    marginBottom:20,
    backgroundColor: '#61dafb',
    paddingVertical:'3%',
    borderRadius: 10,
  },
  text:{
    color: '#20232a',
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
  },
  logout: {
    textAlign: 'center',
    fontSize: 20,
    alignSelf:'center',
    color:"red"
  },
});

export default UserInfoScreen;
