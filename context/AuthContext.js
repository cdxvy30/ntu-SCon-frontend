import React, {createContext, useEffect, useState} from 'react';
import axios from 'axios';
import {BASE_URL} from '../configs/authConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [userInfo, setUserInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [splashLoading, setSplashLoading] = useState(false);

  console.log(`AuthProvider: ${isLoading}`);

  const register = (name, corporation, email, password) => {
    setIsLoading(true);
    axios
      .post(`${BASE_URL}/auth/register`, {
        name,
        corporation,
        email,
        password,
      })
      .then(async res => {
        let userInfo = await res.data;
        setUserInfo(userInfo);
        AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
        setIsLoading(false);
        console.log(userInfo);
      })
      .catch(e => {
        console.info(e.response.data);
        console.log(e.response.status);
        console.log(`register error : ${e}`);
        setIsLoading(false);
      });
  };

  const login = (email, password) => {
    setIsLoading(true);
    axios
      .post(`${BASE_URL}/auth/login`, {
        email,
        password,
      })
      .then(async res => {
        let userInfo = await res.data; // token與email, name資訊
        console.log(userInfo);
        setUserInfo(userInfo);
        AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
        setIsLoading(false);
      })
      .catch(e => {
        console.log(e.response.data);
        console.log(e.response.status);
        console.log(`login error : ${e}`);
        setIsLoading(false);
      });
  };

  const logout = () => {
    // setIsLoading(true);
    axios({
      method: 'post',
      url: `${BASE_URL}/auth/logout`,
      data: {
        uuid: userInfo.user.uuid,
      },
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    })
      .then(async res => {
        let status = await res.data;
        console.log(status);
        AsyncStorage.removeItem('userInfo');
        setUserInfo({});
        setIsLoading(false);
      })
      .catch(e => {
        console.log(e.response.data);
        console.log(`logout error ${e}`);
        setIsLoading(false);
      });
  };

  const isLoggedIn = async () => {
    try {
      setSplashLoading(true);

      let userInfo = await AsyncStorage.getItem('userInfo');
      userInfo = JSON.parse(userInfo);

      if (userInfo) {
        setUserInfo(userInfo);
      }

      setSplashLoading(false);
    } catch (e) {
      console.log(`is logged in error ${e}`);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  const getUsers = () => {
    setIsLoading(true);
    console.log('getUsers');

    axios
      .get(`${BASE_URL}/users/all`)
      .then(async res => {
        let users = await res.data.rows;
        console.log(users);
        setIsLoading(false);
      })
      .catch(e => {
        console.info(e);
        console.log(`Get users error : ${e}`);
        setIsLoading(false);
      });
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn,
        userInfo,
        splashLoading,
        register,
        login,
        logout,
        getUsers,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
