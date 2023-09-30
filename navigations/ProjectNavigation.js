import React from 'react';
// import type {Node} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ProjectListScreen from '../screens/project/ProjectListScreen';
import ProjectAddScreen from '../screens/project/ProjectAddScreen';
import IssueListScreen from '../screens/project/IssueListScreen';
import IssueScreen from '../screens/project/IssueScreen';
import PhotoScreen from '../screens/project/PhotoScreen';
import ObjectTypeSelectorScreen from '../screens/project/selector/ObjectTypeSelectorScreen';
import IssueTypeSelectorScreen from '../screens/project/selector/IssueTypeSelectorScreen';
import DateSelectorScreen from '../screens/project/selector/DateSelectorScreen';
import RegulationListScreen from '../screens/project/RegulationListScreen';
import IssueLocationListScreen from '../screens/project/IssueLocationListScreen';
import IssueLocationAddScreen from '../screens/project/IssueLocationAddScreen';
import CorporationAddScreen from '../screens/project/CorporationAddScreen';
import CorporationListScreen from '../screens/project/CorporationListScreen';
import TaskAddScreen from '../screens/project/TaskAddScreen';
import TaskListScreen from '../screens/project/TaskListScreen';

import RemoteImageWithSketch from '../screens/project/RemoteImageWithSketch';

const Stack = createNativeStackNavigator();

const ProjectNavigation = ({navigation}) => {
  return (
    <React.Fragment>
      <Stack.Navigator>
        <Stack.Screen
          name="ProjectList"
          component={ProjectListScreen}
          options={{title: '專案列表'}}
        />
        <Stack.Screen
          name="IssueList"
          component={IssueListScreen}
          options={({route}) => ({title: route.params.project.project_name})}
        />
        <Stack.Screen
          name="Issue"
          component={IssueScreen}
          options={{title:'', gestureEnabled: false,}}
        />
        <Stack.Group screenOptions={{presentation: 'modal'}}>
          <Stack.Screen
            name="ProjectAdd"
            component={ProjectAddScreen}
            options={{title: '新增專案'}}
          />
        </Stack.Group>
        <Stack.Screen
          name="Photo"
          component={PhotoScreen}
          options={{title: '照片標註'}}
        />
        <Stack.Screen
          name="Label"
          component={RemoteImageWithSketch}
          options={{title: '物件標註'}}
        />
        <Stack.Screen
          name="ObjectTypeSelector"
          component={ObjectTypeSelectorScreen}
          options={{title: '物件類別'}}
        />
        <Stack.Screen
          name="IssueTypeSelector"
          component={IssueTypeSelectorScreen}
          options={{title: '缺失項目'}}
        />
        <Stack.Screen
          name="CorporationList"
          component={CorporationListScreen}
          options={{title: '廠商資訊'}}
        />
        <Stack.Screen
          name="CorporationAdd"
          component={CorporationAddScreen}
          options={{title: '新增廠商'}}
        />
        <Stack.Screen
          name="TaskList"
          component={TaskListScreen}
          options={{title: '工項列表'}}
        />
        <Stack.Screen
          name="TaskAdd"
          component={TaskAddScreen}
          options={{title: '新增工項'}}
        />
        <Stack.Screen
          name="DateSelector"
          component={DateSelectorScreen}
          options={{title: '選取日期範圍'}}
        />
        <Stack.Screen
          name="IssueLocationList"
          component={IssueLocationListScreen}
          options={{title: '缺失地點列表'}}
        />
        <Stack.Screen
          name="IssueLocationAdd"
          component={IssueLocationAddScreen}
          options={{title: '新增缺失地點'}}
        />
        <Stack.Screen
          name="RegulationList"
          component={RegulationListScreen}
          options={{title: '公司內部規範'}}
        />
      </Stack.Navigator>
    </React.Fragment>
  );
};

export default ProjectNavigation;
