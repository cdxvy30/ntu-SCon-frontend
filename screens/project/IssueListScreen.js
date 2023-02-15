/* eslint-disable prettier/prettier */
import React, {useEffect, useState, useContext} from 'react';
import {AuthContext} from '../../context/AuthContext';
import {
  ActionSheetIOS,
  Alert,
  Button,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Swipeout from 'react-native-swipeout';
import Separator from '../../components/Separator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Badge, Icon} from 'react-native-elements';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import SqliteManager from '../../services/SqliteManager';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';
import {useIsFocused} from '@react-navigation/native';
import {
  transformIssues,
  transformExportIssues,
  transformExportIssues_excel,
} from '../../util/sqliteHelper';
import {ISSUE_STATUS} from './IssueEnum';
import {Document, Packer} from 'docx';
import {
  issueReportGenerator,
  improveReportGenerator,
  issueHtmlGenerator,
} from './OutputTable';
import axios from 'axios';
import FastImage from 'react-native-fast-image';
import { BASE_URL } from '../../configs/authConfig';
// import { MobileModel, Image } from "react-native-pytorch-core";

// 定義缺失風險指標
const determineStatusColor = item => {
  let color = 'grey';
  if (item.issue_status === '0') color = 'limegreen';
  if (item.issue_status === '1') color = 'gold';
  if (item.issue_status === '2') color = 'orangered';

  return color;
};

const IssueListScreen = ({navigation, route}) => {
  // console.log(route.params.project);
  // const project = route.params;
  const { userInfo } = useContext(AuthContext);

  const [project, setProject] = useState(route.params.project);
  const [issueList, setIssueList] = useState([]);
  const [selectedIssueList, setSelectedIssueList] = useState(issueList);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [isDedecting, setIsDedecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const isFocused = useIsFocused();

  function issuesFilter(Issues) {
    var a = [];
    for (let i = 0; i < Issues.length; i++) {
      if (
        new Date(selectedEndDate).getTime() + 43200000 >=
          new Date(Issues[i].createat).getTime() &&
        new Date(selectedStartDate).getTime() - 43200000 <=
          new Date(Issues[i].createat).getTime()
      ) {
        a.push(Issues[i]);
      }
    }
    return a;
  }

  // @處理刪除缺失動作
  const issueDeleteHandler = async () => {
    Alert.alert('刪除議題', '真的要刪除議題嗎？', [
      {
        text: '取消',
        onPress: () => {
          console.log('Cancel delete issue');
        },
        style: 'cancel',
      },
      {
        text: '確定',
        onPress: async () => {
          await SqliteManager.deleteIssue(selectedIssueId);
          selectedEndDate
            ? setSelectedIssueList(
                issueList.filter(i => i.id !== selectedIssueId),
              )
            : setIssueList(issueList.filter(i => i.id !== selectedIssueId));
        },
        style: 'destructive',
      },
    ]);
  };

  // @處理更新缺失動作, 導入IssueScreen
  // action為"update existing issue"
  const issueSelectHandler = async item => {
    console.log('/// item in issueSeleceHandler ///');
    let issueId = item.issue_id;
    setSelectedIssueId(item.issue_id);

    await RNFetchBlob.config({             //先暫時載到本地端
      fileCache: true,
    })
      .fetch('GET', `${BASE_URL}/issues/get/thumbnail/${item.issue_id}`)
      .then((res) => {
        console.log('imagepath',res.data)
        navigation.navigate('Issue', {
          project: project,
          issueId: issueId,                                 // 更新issue時要知道issueId
          action: 'update existing issue',
          item: CreateItemByExistingIssue(item, res),
        });
      })
      .catch(err => {
        console.log(err)
      });
  };

  const CreateItemByExistingIssue = (item, res) => {
    return {
      id: item.issue_id,
      title: item.issue_title,
      type: item.issue_type,
      violation_type: item.issue_title,
      image: {
        uri: res.data,
        height: parseInt(item.issue_image_height, 10),
        width: parseInt(item.issue_image_width, 10)
      },
      status: item.issue_status,
      tracking: item.tracking_or_not,
      location: item.issue_location,
      activity: item.issue_task,
      assignee: item.issue_recorder,
      assignee_phone_number: '',
      responsible_corporation: '',
      safetyManager: item.issue_recorder,
      attachments: [],
      labels: [],
      timestamp: new Date().toLocaleString(),
    };
  };

  // @處理將照片送出並辨識動作, 並觸發CreateItemByImage, 導入IssueScreen
  // action為"create new issue"
  const detectViolationTypeThenSwitchToIssueScreen = async imagee => {
    console.log('Send image detect request');
    setIsDedecting(true);
    var bodyFormData = new FormData();
    let image = imagee;
    image.uri = 'file://' + image.uri.replace('file://', '');
    bodyFormData.append('file', {
      uri: image.uri,
      name: image.fileName,
      type: 'image/jpg',
    });
    axios({
      method: 'post',
      url: 'http://34.80.209.101:8000/predict',
      data: bodyFormData,
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: 5000,
    })
      .then(async function (response) {
        //handle success
        //console.log(response.data);
        setIsDedecting(false);
        navigation.navigate('Issue', {
          project: project,
          action: 'create new issue',
          violation_type: response.data.violation_type,
          item: CreateItemByImage(image),
        });
      })
      .catch(e => {
        //handle error
        setIsDedecting(false);
        Alert.alert('辨識失敗');
        console.log(response);
        navigation.navigate('Issue', {
          project: project,
          action: 'create new issue',
          violation_type: '',
          item: CreateItemByImage(image),
        });
        console.log(e);
      });
  };

  // @處理缺失輸出動作
  const outputReportHandler = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          '取消',
          '匯出專案資訊',
          '匯出專案圖片',
          '匯出缺失記錄表',
          '匯出缺失改善前後記錄表(WORD)',
          '匯出缺失改善前後記錄表(HTML)',
        ],
        // destructiveButtonIndex: [1,2],
        cancelButtonIndex: 0,
        userInterfaceStyle: 'light', //'dark'
      },
      async buttonIndex => {
        const { config, fs } = RNFetchBlob;
        const dirs = RNFetchBlob.fs.dirs;
        const docPath = dirs.DocumentDir;
        const projectName = route.params.name;
        // const base64 = RNFetchBlob.base64;
        switch (buttonIndex) {
          case 0: // cancel action
            break;
          case 1:
            await fs.writeFile(
              `${docPath}/${projectName}-data.json`,
              JSON.stringify(
                transformExportIssues(
                  selectedEndDate ? selectedIssueList : issueList,
                ),
              ),
              'utf8',
            );

            const shareDataOption = {
              title: 'MyApp',
              message: `${projectName}-data`,
              url: `file://${docPath}/${projectName}-data.json`,
              type: 'application/json',
              subject: `${projectName}-data`, // for email
            };

            await Share.open(shareDataOption); // ...after the file is saved, send it to a system share intent
            break;

          case 2:
            let urls = (selectedEndDate ? selectedIssueList : issueList).map(
              issue => 'file://' + issue.image.uri,
            );
            (selectedEndDate ? selectedIssueList : issueList).map(issue =>
              issue.attachments.map(
                att => (urls = urls.concat('file://' + att.image)),
              ),
            );

            const shareImageOption = {
              title: 'MyApp',
              message: `${project.project_name}-image`,
              urls,
              subject: `${project.project_name}-image`, // for email
            };
            await Share.open(shareImageOption);
            break;

          case 3:
            try{
                setIsExporting(true);

                let options = {
                  session : 'output_image',
                  fileCache: true,
                }
                for (let i = issueList.length - 1; i >= 0; i--){
                  await RNFetchBlob.config(options)
                    .fetch('GET', `${BASE_URL}/issues/get/thumbnail/${selectedEndDate ? selectedIssueList[i].issue_id : issueList[i].issue_id}`)
                    .then(() => {
                      console.log(RNFetchBlob.session('output_image').list().length)
                    })
                    .catch(err => {
                      console.log(err)
                    });
                }
                const doc = new Document({
                  sections: issueReportGenerator(
                    userInfo,
                    project,
                    selectedEndDate,
                    selectedStartDate,
                    selectedEndDate ? selectedIssueList : issueList,
                    fs,
                  ),
                });
    
                await Packer.toBase64String(doc).then(base64 => {
                  fs.writeFile(
                    `${docPath}/${project.project_name}-缺失記錄表.docx`,
                    base64,
                    'base64',
                  );
                });

                const shareDataTableOption = {
                  title: 'MyApp',
                  message: `${project.project_name}-缺失記錄表`,
                  url: `file://${docPath}/${project.project_name}-缺失記錄表.docx`,
                  type: 'application/docx',
                  subject: `${project.project_name}-缺失記錄表`, // for email
                };
    
                await Share.open(shareDataTableOption); // ...after the file is saved, send it to a system share intent

                Alert.alert('匯出成功！', '', [
                  {
                    text: '返回',
                    onPress: () => setIsExporting(false),
                    style: 'cancel',
                  },
                ]);
            }
            catch(error){
              Alert.alert('匯出取消或失敗', '', [
                {
                  text: '返回',
                  onPress: () => setIsExporting(false),
                  style: 'cancel',
                },
              ]);
            }
            finally{
              RNFetchBlob.session('output_image').dispose();
            }
              
          case 4:
              setIsExporting(true);
              const doc_2 = new Document({
                sections: [
                  {
                    properties: {},
                    children: improveReportGenerator(
                      selectedEndDate ? selectedIssueList : issueList,
                      fs,
                      config,
                      project,
                    ),
                  },
                ],
              });
  
              await Packer.toBase64String(doc_2).then(base64 => {
                console.log('exporting Roport');
                fs.writeFile(
                  `${docPath}/${project.project_name}-缺失改善前後記錄表.docx`,
                  base64,
                  'base64',
                );
              });
  
              const shareDataTableOption_2 = {
                title: 'MyApp',
                message: `${project.project_name}-缺失改善前後記錄表`,
                url: `file://${docPath}/${project.project_name}-缺失改善前後記錄表.docx`,
                type: 'application/docx',
                subject: `${project.project_name}-缺失改善前後記錄表`, // for email
              };
  
              await Share.open(shareDataTableOption_2); // ...after the file is saved, send it to a system share intent
              break;

          // case 5:
          //   const issue_web = issueHtmlGenerator(
          //     selectedEndDate ? selectedIssueList : issueList,
          //     fs,
          //     config,
          //     project,
          //   );
          //   await fs.writeFile(
          //     `${docPath}/${project.project_name}-缺失改善前後錄表.html`,
          //     issue_web.html,
          //     'utf8',
          //   );
          //   const shareDataOption_3 = {
          //     title: 'MyApp',
          //     message: `${project.project_name}-缺失改善前後錄表`,
          //     url: `file://${docPath}/${project.project_name}-缺失改善前後錄表.html`,
          //     type: 'application/html',
          //     subject: `${project.project_name}-缺失改善前後錄表`, // for email
          //   };

          //   await Share.open(shareDataOption_3); // ...after the file is saved, send it to a system share intent
          //   break;
        }
      },
    );
  };

  // @處理時間排序動作
  const issueSortHandler = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['取消', '依時間排序(由新到舊)', '依時間排序(由舊到新)'],
        // options: ['取消', '依時間排序(由新到舊)', '依時間排序(由舊到新)', '依追蹤缺失數量排序'],
        // destructiveButtonIndex: [1,2],
        cancelButtonIndex: 0,
        userInterfaceStyle: 'light', //'dark'
      },
      buttonIndex => {
        switch (buttonIndex) {
          case 0:
            break; // cancel action
          case 1:
            selectedEndDate
              ? selectedIssueList.sort(
                  (a, b) => new Date(b.createat) - new Date(a.createat),
                )
              : issueList.sort(
                  (a, b) => new Date(b.createat) - new Date(a.createat),
                );
            selectedEndDate
              ? setSelectedIssueList([...selectedIssueList])
              : setIssueList([...issueList]);
            break;
          case 2:
            selectedEndDate
              ? selectedIssueList.sort(
                  (a, b) => new Date(a.createat) - new Date(b.createat),
                )
              : issueList.sort(
                  (a, b) => new Date(a.createat) - new Date(b.createat),
                );
            selectedEndDate
              ? setSelectedIssueList([...selectedIssueList])
              : setIssueList([...issueList]);
            break;            
          // case 3:
          //   selectedEndDate
          //     ? selectedIssueList.sort(
          //         (a, b) => b.attachments.length - a.attachments.length,
          //       )
          //     : issueList.sort(
          //         (a, b) => b.attachments.length - a.attachments.length,
          //       );
          //   selectedEndDate
          //     ? setSelectedIssueList([...selectedIssueList])
          //     : setIssueList([...issueList]);
          //   break;
        }
      },
    );
  };

  // @處理日期篩選與還原動作
  const issueOptionHandler = React.useCallback(() => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['取消', '按日期篩選', '恢復全部顯示'],
        // destructiveButtonIndex: [1,2],
        cancelButtonIndex: 0,
        userInterfaceStyle: 'light', //'dark'
      },
      async buttonIndex => {
        switch (buttonIndex) {
          case 0:
            break; // cancel action
          case 1:
            await navigation.navigate('DateSelector', {
              setSelectedStartDate,
              setSelectedEndDate,
            });
            break;
          case 2:
            setSelectedStartDate(null);
            setSelectedEndDate(null);
        }
      },
    );
  }, [selectedEndDate ? selectedIssueList : issueList, route.params.name]);

  // @!選取照片, 並觸發detectViolationTypeThenSwitchToIssueScreen(image)
  const imageSelectHandler = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['取消', '拍照', '從相簿選取照片'],
        // destructiveButtonIndex: [1,2],
        cancelButtonIndex: 0,
        userInterfaceStyle: 'light', //'dark'
      },
      buttonIndex => {
        switch (buttonIndex) {
          case 0: // cancel action
            break;
          case 1:
            launchCamera(
              {quality: 0.1, mediaType: 'photo', saveToPhotos: true},
              res => {
                //includeBase64: true --> return base64Image
                if (res.errorMessage !== undefined) {
                  console.error(`code: ${res.errorCode}: ${res.erroMessage}`);
                  return;
                }

                if (!res.didCancel) {
                  const image = res.assets[0];
                  detectViolationTypeThenSwitchToIssueScreen(image);
                }
              },
            );
            break;
          case 2:
            launchImageLibrary({quality: 0.1, mediaType: 'photo'}, res => {
              if (res.errorMessage !== undefined) {
                console.error(`code: ${res.errorCode}: ${res.erroMessage}`);
                return;
              }

              if (!res.didCancel) {
                const image = res.assets[0];
                detectViolationTypeThenSwitchToIssueScreen(image);
              }
            });
            break;
        }
      },
    );
  };

  /*
  // useEffect(() => {
  //   const fetchIssues = async () => {
  //     const project = await SqliteManager.getProjectByName(route.params.name);
  //     const issues = await SqliteManager.getIssuesByProjectId(project.id);
  //     const getHydratedIssuePromises = issues.map(issue =>
  //       SqliteManager.getHydratedIssue(issue.id),
  //     );
  //     const hydratedIssues = await Promise.all(getHydratedIssuePromises);
  //     const transformedIssues = transformIssues(hydratedIssues);
  //     const sortedIssues = transformedIssues.sort(
  //       (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  //     );
  //     setIssueList(sortedIssues);
  //     setProjectId(project.id);
  //     setProject(project);
  //     setSelectedIssueList(issuesFilter(sortedIssues));
  //   };

  //   if (isFocused) {
  //     fetchIssues();
  //   }
  //   selectedIssueList;
  // }, [route.params.name, issueReportGenerator, isFocused]);
  */

  // 向後端請求此project的issues list
  // **************************************** //
  useEffect(() => {
    const fetchIssues = async () => {
      await axios
        .get(`${BASE_URL}/issues/list/${project.project_id}`)
        .then(async (res) => {
          let issues = await res.data;
          sortIssues = issues.sort(               //按照時間將issues排序
            (a, b) => new Date(b.create_at) - new Date(a.create_at)
          )
          setIssueList(sortIssues);
          setSelectedIssueList(issuesFilter(sortIssues));
        })
        .catch((e) => {
          console.log(`List issues error: ${e}`);
        });
    };
    const deleteTmpFiles = () => {
      try{
        RNFetchBlob.fs.unlink(RNFetchBlob.fs.dirs.DocumentDir + "/RNFetchBlob_tmp/")
      }
      catch(e){
        console.log(e)
      }
    }

    if (isFocused) {
      fetchIssues();
      deleteTmpFiles();
    }
  }, [isFocused, project.project_id]);
  // **************************************** //

  // 頂端列按鈕行為: 時間排序/依日期篩選/匯出缺失記錄表
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <React.Fragment>
          <Icon
            style={{marginRight: 10}}
            name="ios-swap-vertical-sharp"
            type="ionicon"
            color="dodgerblue"
            size={25}
            onPress={() => issueSortHandler()}
          />
          <Icon
            style={{marginRight: 10}}
            name="ios-filter"
            type="ionicon"
            color="dodgerblue"
            size={25}
            onPress={() => issueOptionHandler()}
          />
          <Icon
            name="ios-document-text"
            type="ionicon"
            color="dodgerblue"
            size={25}
            onPress={() => outputReportHandler()}
          />
        </React.Fragment>
      ),
    });
  }, [issueOptionHandler, navigation]);

  // 右滑刪除動作, 實作在Swipeout元件中
  const swipeBtns = [
    {
      text: <Ionicons name={'ios-trash'} size={24} color={'white'} />,
      backgroundColor: 'red',
      underlayColor: 'rgba(0, 0, 0, 1, 0.6)',
      onPress: () => issueDeleteHandler(),
    },
  ];

  // 在detectViolationTypeThenSwitchToIssueScreen中觸發
  const CreateItemByImage = image => {
    image.uri = image.uri.replace('file://', '');

    return {
      id: '',
      title: '',
      type: '',
      violation_type: '',
      image,
      status: ISSUE_STATUS.lowRisk.id,
      tracking: true,
      location: '',
      activity: '',
      assignee: '',
      assignee_phone_number: '',
      responsible_corporation: '',
      safetyManager: project.inspector,
      attachments: [],
      labels: [],
      timestamp: new Date().toLocaleString(),
    };
  };

  // List中各單獨元件
  const Item = ({item, onPress, backgroundColor, textColor}) => (
    <TouchableOpacity onPress={onPress} style={[styles.item, backgroundColor]}>
      <View style={styles.panelLeftContainer}>
        {/* <Image
          style={styles.image}
          source={{uri: item.image.uri.replace('file://', '')}}
        /> */}
        <FastImage
          style={styles.image}
          source={{
            uri: `${BASE_URL}/issues/get/thumbnail/${item.issue_id}`,
          }}
        />
        {item.tracking ? (
          <Badge
            status="primary"
            containerStyle={styles.badge}
            value={item.attachments.length}
          />
        ) : undefined}
      </View>
      <View style={styles.panelRightContainer}>
        <View style={styles.timestampContainer}>
          <Ionicons
            style={styles.status}
            name={'ios-ellipse'}
            size={16}
            color={determineStatusColor(item)}
          />
          <Text style={[styles.timestampText, textColor]}>
            {item.create_at}
          </Text>
        </View>
        <Text style={[styles.descriptionText, textColor]}>
          {/* {item.violation_type === '其他'
            ? `[${item.violation_type}]\n${item.type_remark}`
            : item.violation_type !== ''
            ? `(${item.violation_type})\n${item.title}`
            : ''} */}
            {item.issue_title}{`\n`}{item.issue_type}
        </Text>
        <View style={styles.objLabelAreaContainer}>
          {Array.isArray(item.labels) ? (
            item.labels.map((label, i) => {
              return (
                <View key={`item_object_${i}`} style={styles.objLabelContainer}>
                  <Text style={styles.objLabelTxt}>{label.name}</Text>
                </View>
              );
            })
          ) : (
            <></>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({item}) => {
    const backgroundColor = item.id === selectedIssueId ? 'white' : 'white'; //"#6e3b6e" : "#f9c2ff";
    const color = item.id === selectedIssueId ? 'black' : 'black'; //'white' : 'black';
    
    return (
      <React.Fragment>
        <Swipeout
          key={item.issue_id}
          right={swipeBtns}
          onOpen={() => setSelectedIssueId(item.issue_id)}>
          <Item
            key={`${item.issue_id}`}
            item={item}
            onPress={() => issueSelectHandler(item)}
            backgroundColor={{backgroundColor}}
            textColor={{color}}
          />
        </Swipeout>
        <Separator key={`seperator_${item.issue_id}`} />
      </React.Fragment>
    );
  };

  // 缺失表單生成中, 顯示loading畫面
  if (isExporting === true) {
    return (
      <React.Fragment>
        <SafeAreaView style={styles.container}>
          <View style={styles.loading_container}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={[styles.loading_text]}>缺失表單生成中...</Text>
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  } else if (isDedecting === true) {  // 缺失類別辨識中, 顯示loading畫面
    return (
      <React.Fragment>
        <SafeAreaView style={styles.container}>
          <View style={styles.loading_container}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={[styles.loading_text]}>缺失類別辨識中...</Text>
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  } else {  // 正常顯示issueList情況
    return (
      <React.Fragment>
        <SafeAreaView style={styles.container}>
          <FlatList
            ListHeaderComponent={<Separator />}
            data={selectedEndDate ? selectedIssueList : issueList}
            // data={issueList}
            renderItem={renderItem}
            keyExtractor={item => item.issue_id}
            extraData={selectedIssueId}
          />
          <View style={styles.addPhotoBtn}>
            <Icon
              raised
              name="ios-add"
              type="ionicon"
              color="dodgerblue"
              size={32}
              iconStyle={{fontSize: 52, marginLeft: 4}}
              onPress={() => imageSelectHandler()}
            />
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    padding: 5,
    flex: 1,
    flexDirection: 'row',
    // marginVertical: 8,
    // marginHorizontal: 16,
    height: 140,
  },
  panelLeftContainer: {
    width: '45%',
  },
  image: {
    height: '100%',
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  panelRightContainer: {
    paddingLeft: 12,
    width: '55%',
    flex: 1,
    flexDirection: 'column',
  },
  timestampContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  timestampText: {
    marginLeft: 5,
    fontSize: 12,
  },
  status: {
    marginTop: 0,
  },
  descriptionText: {
    fontSize: 20,
  },
  objLabelAreaContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 8,
  },
  objLabelContainer: {
    marginLeft: 2,
    marginRight: 2,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 3,
    backgroundColor: 'gray',
    height: 20,
  },
  objLabelTxt: {
    fontSize: 16,
    color: 'white',
  },
  addPhotoBtn: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'flex-end',
    marginBottom: 15,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOpacity: 0.8,
    shadowRadius: 13,
    shadowOffset: {width: 3, height: 8},
  },
  loading_container: {
    position: 'absolute',
    alignItems: 'center',
    alignSelf: 'center',
    display: 'flex',
    marginTop: 300,
  },
  loading_text: {
    fontSize: 32,
    color: 'white',
    backgroundColor: 'gray',
  },
});

export default IssueListScreen;
