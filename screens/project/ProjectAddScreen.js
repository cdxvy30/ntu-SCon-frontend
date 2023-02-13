import React, {useState, useContext, useEffect} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import {AuthContext} from '../../context/AuthContext';
// import RNFetchBlob from 'rn-fetch-blob';
import {
  ActionSheetIOS,
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import SqliteManager from '../../services/SqliteManager';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {PROJECT_STATUS} from './ProjectEnum';
import axios from 'axios';
import {BASE_URL} from '../../configs/authConfig';

const ProjectAddScreen = ({navigation, route}) => {
  const { userInfo } = useContext(AuthContext);
  let project = route.params.project;
  // console.log(userInfo);
  const [thumbnail, setThumbnail] = useState(project ? project.image : '');
  const [name, setName] = useState(project ? project.name : '');
  const [address, setAddress] = useState(project ? project.address : '');
  // const [manager, setManager] = useState(project ? project.manager : '');
  const [corporation, setCorporation] = useState(
    project ? project.corporation : userInfo.user.corporation,
  );
  // const [inspector, setInspector] = useState(
  //   project ? project.inspector : userInfo.user.name,
  // );
  // const [email, setEmail] = useState(
  //   project ? project.email : userInfo.user.email,
  // );
  // const [managerSource, setManagerSource] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const projectAddHandler = React.useCallback(async () => {
    if (!name) {
      Alert.alert('請填入工地名稱');
      return;
    }

    const users = await SqliteManager.getAllUsers(); // 改成從伺服器fetch
    const newProject = {
      name,
      address,
      corporation,
      user_id: users[0].id,
      image:
        thumbnail.uri ??
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVZ5Jn3h_R2_PdWnYoXgOqjwFKT5C4JTODvCjfDwaleOsM6AxT8L1DBhRi4FeGP7ua7F8&usqp=CAU',
      status: PROJECT_STATUS.lowRisk.id,
    };

    const projectAddToPGSQL = () => {
      setIsLoading(true);

      const data = {
        name: name,
        address: address,
        corporation: corporation,
      };
      const metadata = JSON.stringify(data);
      var bodyFormData = new FormData();
      bodyFormData.append('metadata', metadata);
      bodyFormData.append('project_thumbnail', {
        uri: thumbnail.uri,
        name: thumbnail.fileName,
        // type: 'image/jpg',
      });
      axios({
        method: 'post',
        url: `${BASE_URL}/projects/add`,
        data: bodyFormData,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ` + `${userInfo.token}`,
        },
      })
        .then(async (res) => {
          let project_data = await res.data;
          console.log(project_data);
          setIsLoading(false);
        })
        .catch((e) => {
          console.log(`Add new project error: ${e}`);
        });
    };
    await projectAddToPGSQL();
    // await SqliteManager.createProject(newProject);
    navigation.goBack();
  }, [
    name,
    address,
    corporation,
    thumbnail.uri,
    thumbnail.fileName,
    navigation,
    userInfo.token,
  ]);

  const projectUpdateHandler = React.useCallback(async () => {
    if (!name) {
      Alert.alert('請填入工地名稱');
      return;
    }

    const users = await SqliteManager.getAllUsers();
    const newProject = {
      name,
      address,
      corporation,
      user_id: users[0].id,
      image:
        thumbnail.uri ??
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVZ5Jn3h_R2_PdWnYoXgOqjwFKT5C4JTODvCjfDwaleOsM6AxT8L1DBhRi4FeGP7ua7F8&usqp=CAU',
    };
    await SqliteManager.updateProject(route.params.project.id, newProject);
    navigation.goBack();
  }, [
    name,
    address,
    corporation,
    thumbnail.uri,
    // route.params.project.id,
    navigation,
  ]);

  const imageSelectHandler = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['選擇縮圖', '刪除縮圖', '取消'],
        destructiveButtonIndex: [1],
        cancelButtonIndex: 1,
        userInterfaceStyle: 'light', //'dark'
      },
      buttonIndex => {
        switch (buttonIndex) {
          case 0:
            launchImageLibrary({mediaType: 'photo'}, res => {
              if (res.errorMessage !== undefined) {
                console.error(`code: ${res.errorCode}: ${res.errorMessage}`);
                return;
              }

              if (!res.didCancel) {
                const image = {
                  ...res.assets[0],
                  uri: res.assets[0].uri.replace('file://', ''),
                };
                setThumbnail(image);
              }
            });
            break;
          case 1:
            setThumbnail(undefined);
            break;
        }
      },
    );
  };

  // useEffect(() => {
  //   if (userInfo.user.permission === "管理員") {
  //     axios
  //       .get(`${BASE_URL}/users/managers/all`)
  //       .then(async (res) => {
  //         let data = await res.data;
  //         setManagerSource(data);
  //       })
  //       .catch((e) => {
  //         console.log(`List available managers error: ${e}`);
  //       });
  //   } else if (userInfo.user.permission === "公司負責人") {
  //     axios
  //       .get(`${BASE_URL}/users/managers/${userInfo.user.corporation}`)
  //       .then(async (res) => {
  //         let data = await res.data;
  //         setManagerSource(data);
  //       })
  //       .catch((e) => {
  //         console.log(`List available managers error: ${e}`);
  //       });
  //   }
  // }, [userInfo.user.corporation, userInfo.user.permission]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          title="完成"
          onPress={project ? projectUpdateHandler : projectAddHandler}
        />
      ),
      headerLeft: () => (
        <Button
          title="取消"
          onPress={() => {
            navigation.goBack();
          }}
        />
      ),
    });
  }, [projectAddHandler, navigation]);

  return (
    <React.Fragment>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.imageAreaContainer}>
            <TouchableOpacity onPress={imageSelectHandler}>
              <View style={styles.imageContainer}>
                {thumbnail ? (
                  <Image style={styles.image} source={{uri: thumbnail.uri}} />
                ) : (
                  <Ionicons
                    style={{
                      fontSize: 130,
                      color: 'goldenrod',
                      paddingVertical: 40,
                      // backgroundColor: 'gray',
                    }}
                    name={'ios-image'}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.inputAreaContainer}>
            <Text style={styles.title}>工地名稱</Text>
            <View style={styles.inputContainer}>
              <NewProjectTextInput
                multiline={false}
                numberOfLines={1}
                onChangeText={text => setName(text)}
                value={name}
                style={styles.input}
              />
            </View>
            <Text style={styles.title}>工地地址</Text>
            <View style={styles.inputContainer}>
              <NewProjectTextInput
                multiline={false}
                numberOfLines={1}
                onChangeText={text => setAddress(text)}
                value={address}
                style={styles.input}
              />
            </View>
            {/* <Text style={styles.title}>專案管理員</Text> */}
            {/* <Dropdown
              data={managerSource}
              placeholder="選擇您的專案管理員"
              labelField="label"
              valueField="value"
              value={manager}
              onChange={item => {
                setManager(item.value);
              }}
            /> */}
            {/* <View style={styles.inputContainer}>
              <NewProjectTextInput
                multiline={false}
                numberOfLines={1}
                onChangeText={text => setManager(text)}
                value={manager}
                style={styles.input}
              />
            </View> */}
            {/* <Text style={styles.title}>公司名稱</Text>
            <View style={styles.inputContainer}>
              <NewProjectTextInput
                multiline={false}
                numberOfLines={1}
                onChangeText={text => setCorporation(text)}
                value={corporation}
                style={styles.input}
              />
            </View>
            <Text style={styles.title}>記錄人員</Text>
            <View style={styles.inputContainer}>
              <NewProjectTextInput
                multiline={false}
                numberOfLines={1}
                onChangeText={text => setInspector(text)}
                value={inspector}
                style={styles.input}
              />
            </View>
            <Text style={styles.title}>電子郵件</Text>
            <View style={styles.inputContainer}>
              <NewProjectTextInput
                multiline={false}
                numberOfLines={1}
                onChangeText={text => setEmail(text)}
                value={email}
                style={styles.input}
              />
            </View> */}
          </View>
          <View style={{height: 300}} />
        </ScrollView>
      </SafeAreaView>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageAreaContainer: {
    paddingVertical: 5,
  },
  imageContainer: {
    backgroundColor: 'lightgray',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 220,
  },
  inputAreaContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  inputContainer: {
    borderBottomColor: 'darkgray',
    borderBottomWidth: 1,
  },
  input: {
    height: 30,
    fontSize: 20,
    marginTop: 3,
    // paddingBottom: 3,
    // paddingTop: 8,
    // padding: 10,
  },
  dropdown: {
    marginTop: 10,
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  title: {
    color: 'gray',
    fontSize: 18,
    marginTop: 18,
  },
});

const NewProjectTextInput = props => {
  return (
    <TextInput
      {...props} // Inherit any props passed to it; e.g., multiline, numberOfLines below
      editable={true}
      maxLength={40}
    />
  );
};

export default ProjectAddScreen;
