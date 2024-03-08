import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';

import AuthStackNav from './Navigation/loginStackNav';


export default function App() {
  return (
    <NavigationContainer>
      <AuthStackNav/>
      
    </NavigationContainer>
  );
}